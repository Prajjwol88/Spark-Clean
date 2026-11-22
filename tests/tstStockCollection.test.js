// Tests for clsStockCollection
// The property tests need no database. The other tests need the sparkclean database
// with 01_tables.sql, 02_test_data.sql and 03_stored_procedures.sql loaded.
const { test } = require('node:test');
const assert = require('node:assert');
const clsStock = require('../classes/clsStock');
const clsStockCollection = require('../classes/clsStockCollection');

function makeProduct() {
  const s = new clsStock();
  s.ProductName = 'Test Product';
  s.Category = 'Testing';
  s.Price = 1.5;
  s.QuantityInStock = 12;
  s.DateAdded = clsStock.today();
  s.Available = true;
  return s;
}

// ---------- properties (no database) ----------

test('InstanceOK', () => { assert.ok(new clsStockCollection()); });

test('StockListOK', () => {
  const all = new clsStockCollection();
  const list = [makeProduct()];
  all.StockList = list;
  assert.deepStrictEqual(all.StockList, list);
});

test('CountPropertyOK', () => {
  const all = new clsStockCollection();
  all.StockList = [makeProduct(), makeProduct()];
  assert.strictEqual(all.Count, 2);
});

test('ThisStockPropertyOK', () => {
  const all = new clsStockCollection();
  const s = makeProduct();
  all.ThisStock = s;
  assert.strictEqual(all.ThisStock, s);
});

// ---------- database methods ----------

test('ListAndCountFromDatabaseOK', async () => {
  const all = new clsStockCollection();
  await all.LoadAll();
  assert.ok(all.Count >= 1);
});

test('FindMethodOK', async () => {
  const s = new clsStock();
  assert.strictEqual(await s.Find(1), true);
  assert.strictEqual(s.ProductNo, 1);
});

test('FindNotFound', async () => {
  assert.strictEqual(await new clsStock().Find(999999), false);
});

test('AddMethodOK', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  const newNo = await all.Add();
  assert.ok(newNo > 0);

  const found = new clsStock();
  assert.strictEqual(await found.Find(newNo), true);
  assert.strictEqual(found.ProductName, 'Test Product');
  assert.strictEqual(found.Price, 1.5);

  await all.Delete(); // tidy up
});

test('UpdateMethodOK', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  const newNo = await all.Add();

  all.ThisStock.ProductName = 'Updated Product';
  all.ThisStock.QuantityInStock = 99;
  await all.Update();

  const found = new clsStock();
  await found.Find(newNo);
  assert.strictEqual(found.ProductName, 'Updated Product');
  assert.strictEqual(found.QuantityInStock, 99);

  await all.Delete(); // tidy up
});

test('DeleteMethodOK', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  const newNo = await all.Add();
  assert.strictEqual(await all.Delete(), 'Deleted');
  assert.strictEqual(await new clsStock().Find(newNo), false);
});

test('DeleteProductOnOrderMarksUnavailable', async () => {
  // product 1 is on an order line in the test data
  const s = new clsStock();
  await s.Find(1);
  const wasAvailable = s.Available;

  const all = new clsStockCollection();
  all.ThisStock = s;
  assert.strictEqual(await all.Delete(), 'MarkedUnavailable');

  const after = new clsStock();
  assert.strictEqual(await after.Find(1), true);
  assert.strictEqual(after.Available, false);

  // put it back how it was
  after.Available = wasAvailable;
  all.ThisStock = after;
  await all.Update();
});

test('ReportByNameOrCategoryNoneFound', async () => {
  const all = new clsStockCollection();
  await all.ReportByNameOrCategory('xxxxxx');
  assert.strictEqual(all.Count, 0);
});

test('ReportByNameOrCategoryFound', async () => {
  const all = new clsStockCollection();
  await all.ReportByNameOrCategory('Sprays');
  assert.ok(all.Count >= 1);
  for (const s of all.StockList) {
    assert.ok(s.Category.includes('Sprays') || s.ProductName.includes('Sprays'));
  }
});

test('ReportAvailableOnlyInStock', async () => {
  const all = new clsStockCollection();
  await all.ReportAvailable('');
  assert.ok(all.Count >= 1);
  for (const s of all.StockList) {
    assert.strictEqual(s.Available, true);
    assert.ok(s.QuantityInStock > 0);
  }
});

test('LowStockReportOK', async () => {
  const all = new clsStockCollection();
  await all.LowStockReport(5);
  assert.ok(all.Count >= 1);
  for (const s of all.StockList) assert.ok(s.QuantityInStock <= 5);
});

// ---------- Sprint 5: hazard warnings ----------

test('AddWithHazardWarningOK', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  all.ThisStock.HazardWarning = 'Corrosive - keep out of reach of children';
  const newNo = await all.Add();

  const found = new clsStock();
  await found.Find(newNo);
  assert.strictEqual(found.HazardWarning, 'Corrosive - keep out of reach of children');

  await all.Delete(); // tidy up
});

test('UpdateHazardWarningOK', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  const newNo = await all.Add();

  all.ThisStock.HazardWarning = 'Irritant - wear gloves';
  await all.Update();
  const found = new clsStock();
  await found.Find(newNo);
  assert.strictEqual(found.HazardWarning, 'Irritant - wear gloves');

  // a blank warning removes it again
  all.ThisStock.HazardWarning = '';
  await all.Update();
  await found.Find(newNo);
  assert.strictEqual(found.HazardWarning, '');

  await all.Delete(); // tidy up
});

test('HazardWarningShownOnShop', async () => {
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  all.ThisStock.ProductName = 'Hazard Test Product';
  all.ThisStock.HazardWarning = 'Corrosive';
  await all.Add();

  const shop = new clsStockCollection();
  await shop.ReportAvailable('Hazard Test Product');
  assert.strictEqual(shop.Count, 1);
  assert.strictEqual(shop.StockList[0].HazardWarning, 'Corrosive');

  await all.Delete(); // tidy up
});

// ---------- security ----------

test('FilterBlocksSqlInjection', async () => {
  // the filter text is passed to the stored procedure as a parameter, never joined into SQL
  const all = new clsStockCollection();
  await all.ReportByNameOrCategory("' OR '1'='1");
  assert.strictEqual(all.Count, 0);
});

test('ScriptInProductNameStoredAsPlainText', async () => {
  // a product name containing HTML is saved as text; the pages escape it before showing it
  const scriptName = '<script>alert(1)</script>';
  const all = new clsStockCollection();
  all.ThisStock = makeProduct();
  all.ThisStock.ProductName = scriptName;
  const newNo = await all.Add();

  const found = new clsStock();
  assert.strictEqual(await found.Find(newNo), true);
  assert.strictEqual(found.ProductName, scriptName);

  await all.Delete(); // tidy up
});
