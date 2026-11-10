// Presentation layer server: serves the HTML/CSS pages and the stock API
const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./app.config');
const clsStock = require('./classes/clsStock');
const clsStaffLogin = require('./classes/clsStaffLogin');
const clsStockCollection = require('./classes/clsStockCollection');

const app = express();
app.use(express.json());
app.use(session({
  secret: require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 30 * 60 * 1000 } // logged out after 30 minutes
}));

// ---------- login ----------

// pages and API routes that only logged in staff can use
const staffPages = ['/menu.html', '/stock.html', '/stock-edit.html', '/stock-delete.html'];
function requireLogin(req, res, next) {
  if (req.session.staffUser) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Please log in.' });
  return res.redirect('/login.html');
}
app.use(staffPages, requireLogin);
app.use('/api/stock', requireLogin);

app.get('/', (req, res) => res.redirect('/login.html'));
app.use(express.static(path.join(__dirname, 'public')));

// wrong attempts per computer, so the password cannot be guessed over and over
const failedLogins = {};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const key = req.ip;
  const record = failedLogins[key] || { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > Date.now()) {
    const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many wrong attempts. Try again in ${minutes} minute(s).` });
  }

  if (clsStaffLogin.CheckLogin(username, password)) {
    delete failedLogins[key];
    req.session.regenerate(() => {
      req.session.staffUser = config.owner.displayName;
      res.json({ ok: true });
    });
    return;
  }

  record.count += 1;
  if (record.count >= config.maxLoginAttempts) {
    record.count = 0;
    record.lockedUntil = Date.now() + config.lockMinutes * 60000;
  }
  failedLogins[key] = record;
  // same message for a wrong username or password, so it does not reveal which one was wrong
  res.status(401).json({ error: 'Access denied. Only the Stock Manager can log in to this page.' });
});

app.get('/api/me', (req, res) => res.json({ staffUser: req.session.staffUser || null }));

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

// ---------- stock (staff) ----------

// list, find, filter or low stock report
app.get('/api/stock', async (req, res, next) => {
  try {
    const { find, filter, report } = req.query;
    const stock = new clsStockCollection();
    let heading = 'All products';
    let message = '';

    if (find) {
      heading = 'Find result';
      if (!/^\d+$/.test(find)) {
        message = 'The product number must be a whole number.';
      } else {
        const product = new clsStock();
        if (await product.Find(Number(find))) stock.StockList = [product];
        else message = 'Product not found.';
      }
    } else if (report === 'low') {
      heading = `Low stock report (${config.lowStockLevel} or fewer)`;
      await stock.LowStockReport(config.lowStockLevel);
      if (stock.Count === 0) message = 'All products are in stock.';
    } else if (filter) {
      heading = `Products matching "${filter}"`;
      await stock.ReportByNameOrCategory(filter);
      if (stock.Count === 0) message = 'No products found.';
    } else {
      await stock.LoadAll();
    }
    res.json({ heading, message, count: stock.Count, products: stock.StockList, lowStockLevel: config.lowStockLevel });
  } catch (err) { next(err); }
});

// one product
app.get('/api/stock/:no', async (req, res, next) => {
  try {
    const product = new clsStock();
    if (!(await product.Find(Number(req.params.no)))) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) { next(err); }
});

// validates the form and copies it into a clsStock object
function readForm(body) {
  const product = new clsStock();
  const error = product.Valid(body.ProductName, body.Category, body.Price, body.QuantityInStock, body.DateAdded);
  if (error) return { error };
  product.ProductName = body.ProductName.trim();
  product.Category = body.Category.trim();
  product.Price = Number(body.Price);
  product.QuantityInStock = Number(body.QuantityInStock);
  product.DateAdded = body.DateAdded.trim();
  product.Available = Boolean(body.Available);
  return { product };
}

// add
app.post('/api/stock', async (req, res, next) => {
  try {
    const { error, product } = readForm(req.body);
    if (error) return res.status(400).json({ error });
    const stock = new clsStockCollection();
    stock.ThisStock = product;
    const newNo = await stock.Add();
    res.json({ message: `Product ${newNo} added.` });
  } catch (err) { next(err); }
});

// update
app.put('/api/stock/:no', async (req, res, next) => {
  try {
    const { error, product } = readForm(req.body);
    if (error) return res.status(400).json({ error });
    const existing = new clsStock();
    if (!(await existing.Find(Number(req.params.no)))) return res.status(404).json({ error: 'Product not found.' });
    product.ProductNo = existing.ProductNo;
    const stock = new clsStockCollection();
    stock.ThisStock = product;
    await stock.Update();
    res.json({ message: `Product ${product.ProductNo} updated.` });
  } catch (err) { next(err); }
});

// delete (or mark unavailable if the product is on an order)
app.delete('/api/stock/:no', async (req, res, next) => {
  try {
    const product = new clsStock();
    if (!(await product.Find(Number(req.params.no)))) return res.status(404).json({ error: 'Product not found.' });
    const stock = new clsStockCollection();
    stock.ThisStock = product;
    const result = await stock.Delete();
    const message = result === 'Deleted'
      ? `Product ${product.ProductNo} deleted.`
      : `Product ${product.ProductNo} is on an order, so it was marked as unavailable instead of deleted.`;
    res.json({ message });
  } catch (err) { next(err); }
});

// ---------- shop (customers, no login) ----------

app.get('/api/shop', async (req, res, next) => {
  try {
    const stock = new clsStockCollection();
    await stock.ReportAvailable(req.query.filter || '');
    let message = '';
    if (stock.Count === 0) message = req.query.filter ? 'No products found.' : 'Stock will be back soon.';
    res.json({ message, products: stock.StockList });
  } catch (err) { next(err); }
});

// any database error is shown as a friendly message
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Something went wrong with the database. Please try again.' });
});

app.listen(config.port, () => console.log(`SparkClean is running at http://localhost:${config.port}`));
