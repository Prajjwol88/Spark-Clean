// Tests for clsStock: properties and the Valid method (no database needed)
// Valid is tested at the boundaries: extreme min, min-1, min, min+1, mid, max-1, max, max+1, extreme max
const { test } = require('node:test');
const assert = require('node:assert');
const clsStock = require('../classes/clsStock');

// good test data
const productName = 'Multi Surface Spray 750ml';
const category = 'Sprays';
const price = '2.49';
const quantityInStock = '40';
const dateAdded = clsStock.today();

const repeat = (n) => 'a'.repeat(n);
const addDays = (days) => {
  const d = new Date(); d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------- instance and properties ----------

test('InstanceOK', () => { assert.ok(new clsStock()); });
test('ProductNoPropertyOK', () => { const s = new clsStock(); s.ProductNo = 5; assert.strictEqual(s.ProductNo, 5); });
test('ProductNamePropertyOK', () => { const s = new clsStock(); s.ProductName = 'Spin Mop'; assert.strictEqual(s.ProductName, 'Spin Mop'); });
test('CategoryPropertyOK', () => { const s = new clsStock(); s.Category = 'Floor Care'; assert.strictEqual(s.Category, 'Floor Care'); });
test('PricePropertyOK', () => { const s = new clsStock(); s.Price = 3.75; assert.strictEqual(s.Price, 3.75); });
test('QuantityInStockPropertyOK', () => { const s = new clsStock(); s.QuantityInStock = 18; assert.strictEqual(s.QuantityInStock, 18); });
test('DateAddedPropertyOK', () => { const s = new clsStock(); s.DateAdded = '2026-10-05'; assert.strictEqual(s.DateAdded, '2026-10-05'); });
test('AvailablePropertyOK', () => { const s = new clsStock(); s.Available = true; assert.strictEqual(s.Available, true); });

// ---------- Valid: all good data ----------

test('ValidMethodOK', () => {
  assert.strictEqual(new clsStock().Valid(productName, category, price, quantityInStock, dateAdded), '');
});

// ---------- ProductName (1 to 50 characters) ----------

const vName = (n) => new clsStock().Valid(n, category, price, quantityInStock, dateAdded);
test('ProductNameMinLessOne', () => assert.notStrictEqual(vName(''), ''));
test('ProductNameMin', () => assert.strictEqual(vName(repeat(1)), ''));
test('ProductNameMinPlusOne', () => assert.strictEqual(vName(repeat(2)), ''));
test('ProductNameMaxLessOne', () => assert.strictEqual(vName(repeat(49)), ''));
test('ProductNameMax', () => assert.strictEqual(vName(repeat(50)), ''));
test('ProductNameMaxPlusOne', () => assert.notStrictEqual(vName(repeat(51)), ''));
test('ProductNameMid', () => assert.strictEqual(vName(repeat(25)), ''));
test('ProductNameExtremeMax', () => assert.notStrictEqual(vName(repeat(500)), ''));

// ---------- Category (1 to 30 characters) ----------

const vCat = (c) => new clsStock().Valid(productName, c, price, quantityInStock, dateAdded);
test('CategoryMinLessOne', () => assert.notStrictEqual(vCat(''), ''));
test('CategoryMin', () => assert.strictEqual(vCat(repeat(1)), ''));
test('CategoryMinPlusOne', () => assert.strictEqual(vCat(repeat(2)), ''));
test('CategoryMaxLessOne', () => assert.strictEqual(vCat(repeat(29)), ''));
test('CategoryMax', () => assert.strictEqual(vCat(repeat(30)), ''));
test('CategoryMaxPlusOne', () => assert.notStrictEqual(vCat(repeat(31)), ''));
test('CategoryMid', () => assert.strictEqual(vCat(repeat(15)), ''));
test('CategoryExtremeMax', () => assert.notStrictEqual(vCat(repeat(300)), ''));

// ---------- Price (0.00 to 9999.99) ----------

const vPrice = (p) => new clsStock().Valid(productName, category, p, quantityInStock, dateAdded);
test('PriceExtremeMin', () => assert.notStrictEqual(vPrice('-10000'), ''));
test('PriceMinLessOne', () => assert.notStrictEqual(vPrice('-0.01'), ''));
test('PriceMin', () => assert.strictEqual(vPrice('0.00'), ''));
test('PriceMinPlusOne', () => assert.strictEqual(vPrice('0.01'), ''));
test('PriceMid', () => assert.strictEqual(vPrice('5000.00'), ''));
test('PriceMaxLessOne', () => assert.strictEqual(vPrice('9999.98'), ''));
test('PriceMax', () => assert.strictEqual(vPrice('9999.99'), ''));
test('PriceMaxPlusOne', () => assert.notStrictEqual(vPrice('10000.00'), ''));
test('PriceExtremeMax', () => assert.notStrictEqual(vPrice('999999'), ''));
test('PriceTooManyDecimals', () => assert.notStrictEqual(vPrice('2.499'), ''));
test('PriceInvalidData', () => assert.notStrictEqual(vPrice('two pounds'), ''));

// ---------- QuantityInStock (0 to 100000) ----------

const vQty = (q) => new clsStock().Valid(productName, category, price, q, dateAdded);
test('QuantityExtremeMin', () => assert.notStrictEqual(vQty('-100000'), ''));
test('QuantityMinLessOne', () => assert.notStrictEqual(vQty('-1'), ''));
test('QuantityMin', () => assert.strictEqual(vQty('0'), ''));
test('QuantityMinPlusOne', () => assert.strictEqual(vQty('1'), ''));
test('QuantityMid', () => assert.strictEqual(vQty('50000'), ''));
test('QuantityMaxLessOne', () => assert.strictEqual(vQty('99999'), ''));
test('QuantityMax', () => assert.strictEqual(vQty('100000'), ''));
test('QuantityMaxPlusOne', () => assert.notStrictEqual(vQty('100001'), ''));
test('QuantityInvalidData', () => assert.notStrictEqual(vQty('ten'), ''));

// ---------- DateAdded (2000-01-01 to today) ----------

const vDate = (d) => new clsStock().Valid(productName, category, price, quantityInStock, d);
test('DateAddedExtremeMin', () => assert.notStrictEqual(vDate(addDays(-365 * 100)), ''));
test('DateAddedMinLessOne', () => assert.notStrictEqual(vDate('1999-12-31'), ''));
test('DateAddedMin', () => assert.strictEqual(vDate('2000-01-01'), ''));
test('DateAddedMinPlusOne', () => assert.strictEqual(vDate('2000-01-02'), ''));
test('DateAddedToday', () => assert.strictEqual(vDate(clsStock.today()), ''));
test('DateAddedTomorrow', () => assert.notStrictEqual(vDate(addDays(1)), ''));
test('DateAddedExtremeMax', () => assert.notStrictEqual(vDate(addDays(365 * 100)), ''));
test('DateAddedInvalidData', () => assert.notStrictEqual(vDate('not a date'), ''));
test('DateAddedNotRealDate', () => assert.notStrictEqual(vDate('2026-02-30'), ''));

// ---------- HazardWarning (Sprint 5: optional, 0 to 100 characters) ----------

const vHazard = (h) => new clsStock().Valid(productName, category, price, quantityInStock, dateAdded, h);
test('HazardWarningPropertyOK', () => { const s = new clsStock(); s.HazardWarning = 'Corrosive'; assert.strictEqual(s.HazardWarning, 'Corrosive'); });
test('HazardWarningDefaultBlank', () => assert.strictEqual(new clsStock().HazardWarning, ''));
test('HazardWarningNotGivenOK', () => assert.strictEqual(new clsStock().Valid(productName, category, price, quantityInStock, dateAdded), ''));
test('HazardWarningBlankOK', () => assert.strictEqual(vHazard(''), ''));
test('HazardWarningMinPlusOne', () => assert.strictEqual(vHazard(repeat(1)), ''));
test('HazardWarningMid', () => assert.strictEqual(vHazard(repeat(50)), ''));
test('HazardWarningMaxLessOne', () => assert.strictEqual(vHazard(repeat(99)), ''));
test('HazardWarningMax', () => assert.strictEqual(vHazard(repeat(100)), ''));
test('HazardWarningMaxPlusOne', () => assert.notStrictEqual(vHazard(repeat(101)), ''));
test('HazardWarningExtremeMax', () => assert.notStrictEqual(vHazard(repeat(500)), ''));
