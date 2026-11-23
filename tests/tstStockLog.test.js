// Tests for clsStockLog (Sprint 5 change log)
// The Valid tests need no database. The other tests need the sparkclean database
// with 04_sprint5_upgrades.sql loaded. Test entries are removed again at the end.
const { test, after } = require('node:test');
const assert = require('node:assert');
const clsStockLog = require('../classes/clsStockLog');

const by = clsStockLog.TEST_USER;

// tidy up: remove only the entries written by these tests
after(async () => { await clsStockLog.DeleteTestEntries(); });

// ---------- instance and Valid (no database) ----------

test('InstanceOK', () => { assert.ok(new clsStockLog()); });
test('CountStartsAtZero', () => { assert.strictEqual(new clsStockLog().Count, 0); });
test('ValidMethodOK', () => { assert.strictEqual(new clsStockLog().Valid(1, 'Added', 'Test Product', by), ''); });
test('ValidEveryActionOK', () => {
  for (const action of clsStockLog.ACTIONS) assert.strictEqual(new clsStockLog().Valid(1, action, 'Test Product', by), '');
});
test('ValidWrongAction', () => { assert.notStrictEqual(new clsStockLog().Valid(1, 'Sold', 'Test Product', by), ''); });
test('ValidProductNoZero', () => { assert.notStrictEqual(new clsStockLog().Valid(0, 'Added', 'Test Product', by), ''); });
test('ValidProductNoNotNumber', () => { assert.notStrictEqual(new clsStockLog().Valid('abc', 'Added', 'Test Product', by), ''); });
test('ValidProductNameBlank', () => { assert.notStrictEqual(new clsStockLog().Valid(1, 'Added', '', by), ''); });
test('ValidProductNameMax', () => { assert.strictEqual(new clsStockLog().Valid(1, 'Added', 'a'.repeat(50), by), ''); });
test('ValidProductNameMaxPlusOne', () => { assert.notStrictEqual(new clsStockLog().Valid(1, 'Added', 'a'.repeat(51), by), ''); });
test('ValidChangedByBlank', () => { assert.notStrictEqual(new clsStockLog().Valid(1, 'Added', 'Test Product', ''), ''); });

// ---------- database methods ----------

test('AddMethodOK', async () => {
  const log = new clsStockLog();
  const logNo = await log.Add(1, 'Updated', 'Test Product', by);
  assert.ok(logNo > 0);
});

test('AddInvalidRejected', async () => {
  await assert.rejects(() => new clsStockLog().Add(1, 'Sold', 'Test Product', by));
});

test('LoadAllNewestFirst', async () => {
  const log = new clsStockLog();
  const first = await log.Add(2, 'Added', 'Log Test First', by);
  const second = await log.Add(2, 'Deleted', 'Log Test Second', by);
  await log.LoadAll();
  assert.ok(log.Count >= 2);
  const numbers = log.LogList.map((e) => e.LogNo);
  assert.ok(numbers.indexOf(second) < numbers.indexOf(first)); // newest first

  const entry = log.LogList.find((e) => e.LogNo === second);
  assert.strictEqual(entry.ProductNo, 2);
  assert.strictEqual(entry.Action, 'Deleted');
  assert.strictEqual(entry.ProductName, 'Log Test Second');
  assert.strictEqual(entry.ChangedBy, by);
  assert.match(entry.ChangedAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/); // date and time recorded
});

test('LogEntryStoredAsPlainText', async () => {
  // a product name containing HTML is saved as text; the change log page escapes it
  const name = '<script>alert(1)</script>';
  const log = new clsStockLog();
  const logNo = await log.Add(3, 'Added', name, by);
  await log.LoadAll();
  assert.strictEqual(log.LogList.find((e) => e.LogNo === logNo).ProductName, name);
});
