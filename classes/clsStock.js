// Middle layer: one product in tblStock
const clsDataConnection = require('../data/clsDataConnection');

class clsStock {
  constructor() {
    this.ProductNo = 0;          // primary key
    this.ProductName = '';       // text, up to 50 characters
    this.Category = '';          // text, up to 30 characters
    this.Price = 0;              // decimal, 0.00 to 9999.99
    this.QuantityInStock = 0;    // integer, 0 to 100000
    this.DateAdded = '';         // date as yyyy-mm-dd
    this.Available = true;       // boolean, shown on the website or not
    this.HazardWarning = '';     // text, up to 100 characters (Sprint 5), blank = no warning
  }

  // finds one product by its product number; returns true if found
  async Find(productNo) {
    const db = new clsDataConnection();
    db.AddParameter('@ProductNo', productNo);
    await db.Execute('sproc_tblStock_FilterByProductNo');
    if (db.Count === 1) {
      this.loadFromRow(db.dataTable[0]);
      return true;
    }
    return false;
  }

  // copies one database row into this object
  loadFromRow(row) {
    this.ProductNo = Number(row.ProductNo);
    this.ProductName = row.ProductName;
    this.Category = row.Category;
    this.Price = Number(row.Price);
    this.QuantityInStock = Number(row.QuantityInStock);
    this.DateAdded = String(row.DateAdded).substring(0, 10);
    this.Available = Boolean(Number(row.Available));
    this.HazardWarning = row.HazardWarning || '';
  }

  // checks the values typed in by staff
  // returns "" if valid, otherwise a message listing every problem
  // hazardWarning is optional (Sprint 5), so the original five-value calls still work
  Valid(productName, category, price, quantityInStock, dateAdded, hazardWarning = '') {
    let error = '';
    const text = (v) => (v === undefined || v === null ? '' : String(v).trim());

    // product name: required, at most 50 characters
    const name = text(productName);
    if (name === '') error += 'The product name may not be blank. ';
    else if (name.length > 50) error += 'The product name must be 50 characters or fewer. ';

    // category: required, at most 30 characters
    const cat = text(category);
    if (cat === '') error += 'The category may not be blank. ';
    else if (cat.length > 30) error += 'The category must be 30 characters or fewer. ';

    // price: a number from 0.00 to 9999.99 with at most 2 decimal places
    const p = text(price);
    if (!/^-?\d+(\.\d+)?$/.test(p)) error += 'The price must be a number. ';
    else if (Number(p) < 0) error += 'The price may not be negative. ';
    else if (Number(p) > 9999.99) error += 'The price must be 9999.99 or less. ';
    else if (p.includes('.') && p.split('.')[1].length > 2) error += 'The price may have at most 2 decimal places. ';

    // quantity in stock: a whole number from 0 to 100000
    const q = text(quantityInStock);
    if (!/^-?\d+$/.test(q)) error += 'The quantity in stock must be a whole number. ';
    else if (Number(q) < 0) error += 'The quantity in stock may not be negative. ';
    else if (Number(q) > 100000) error += 'The quantity in stock must be 100000 or less. ';

    // date added: a real date, not in the future and not before 2000
    const d = text(dateAdded);
    if (!isRealDate(d)) error += 'The date added must be a valid date (yyyy-mm-dd). ';
    else if (d > today()) error += 'The date added may not be in the future. ';
    else if (d < '2000-01-01') error += 'The date added may not be before 2000. ';

    // hazard warning: optional, at most 100 characters
    if (text(hazardWarning).length > 100) error += 'The hazard warning must be 100 characters or fewer. ';

    return error.trim();
  }
}

// true if the text is a real calendar date in yyyy-mm-dd format
function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// today's date as yyyy-mm-dd (local time)
function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

clsStock.today = today;
module.exports = clsStock;
