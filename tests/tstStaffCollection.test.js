// Tests for clsStaffCollection (Staff Management)
// The property tests need no database. The other tests need the sparkclean database
// with database/05_staff_management.sql loaded (SETUP_ALL.sql includes it).
// Every test removes the staff members it adds, so the real data is left as it was.
const { test } = require('node:test');
const assert = require('node:assert');
const clsStaff = require('../classes/clsStaff');
const clsStaffCollection = require('../classes/clsStaffCollection');

// a unique email each time, so tests never clash with real staff or each other
let counter = 0;
function makeStaff() {
  const s = new clsStaff();
  s.FullName = 'Test Staff';
  s.Email = `test.staff.${Date.now()}.${counter++}@example.com`;
  s.Phone = '12345678';
  s.JobRole = 'Tester';
  s.StartDate = clsStaff.today();
  s.HourlyRate = 150.5;
  s.IsManager = false;
  return s;
}

// deactivates then deletes a test staff member
async function tidyUp(all) {
  await all.SetActive(false);
  await all.Delete();
}

// ---------- properties (no database) ----------

test('InstanceOK', () => { assert.ok(new clsStaffCollection()); });

test('StaffListOK', () => {
  const all = new clsStaffCollection();
  const list = [makeStaff()];
  all.StaffList = list;
  assert.deepStrictEqual(all.StaffList, list);
});

test('CountPropertyOK', () => {
  const all = new clsStaffCollection();
  all.StaffList = [makeStaff(), makeStaff()];
  assert.strictEqual(all.Count, 2);
});

test('ThisStaffPropertyOK', () => {
  const all = new clsStaffCollection();
  const s = makeStaff();
  all.ThisStaff = s;
  assert.strictEqual(all.ThisStaff, s);
});

// ---------- database methods ----------

test('ListAndCountFromDatabaseOK', async () => {
  const all = new clsStaffCollection();
  await all.LoadAll();
  assert.ok(all.Count >= 1);
  assert.ok(all.StaffList[0] instanceof clsStaff);
});

test('FindMethodOK', async () => {
  // staff number 1001 is in the test data
  const s = new clsStaff();
  assert.strictEqual(await s.Find(1001), true);
  assert.strictEqual(s.StaffNo, 1001);
});

test('FindNotFound', async () => {
  assert.strictEqual(await new clsStaff().Find(999999), false);
});

test('AddMethodOK', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();
  assert.ok(newNo > 0);

  const found = new clsStaff();
  assert.strictEqual(await found.Find(newNo), true);
  assert.strictEqual(found.FullName, 'Test Staff');
  assert.strictEqual(found.Email, all.ThisStaff.Email);
  assert.strictEqual(found.HourlyRate, 150.5);
  assert.strictEqual(found.StartDate, clsStaff.today());
  assert.strictEqual(found.Active, true); // new staff are always active

  await tidyUp(all);
});

test('UpdateMethodOK', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();

  all.ThisStaff.FullName = 'Updated Staff';
  all.ThisStaff.JobRole = 'Supervisor';
  all.ThisStaff.IsManager = true;
  all.ThisStaff.HourlyRate = 199.99;
  assert.strictEqual(await all.Update(), true);

  const found = new clsStaff();
  await found.Find(newNo);
  assert.strictEqual(found.FullName, 'Updated Staff');
  assert.strictEqual(found.JobRole, 'Supervisor');
  assert.strictEqual(found.IsManager, true);
  assert.strictEqual(found.HourlyRate, 199.99);

  await tidyUp(all);
});

test('UpdateNotFound', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  all.ThisStaff.StaffNo = 999999;
  assert.strictEqual(await all.Update(), false);
});

test('UpdateKeepsStatus', async () => {
  // editing details must not reactivate an inactive staff member
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();
  await all.SetActive(false);
  all.ThisStaff.FullName = 'Still Inactive';
  await all.Update();

  const found = new clsStaff();
  await found.Find(newNo);
  assert.strictEqual(found.Active, false);

  await all.Delete();
});

test('DeactivateAndActivateOK', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();
  const found = new clsStaff();

  assert.strictEqual(await all.SetActive(false), true);
  await found.Find(newNo);
  assert.strictEqual(found.Active, false);

  assert.strictEqual(await all.SetActive(true), true);
  await found.Find(newNo);
  assert.strictEqual(found.Active, true);

  await tidyUp(all);
});

test('SetActiveNotFound', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff.StaffNo = 999999;
  assert.strictEqual(await all.SetActive(false), false);
});

test('DeleteActiveStaffRefused', async () => {
  // business rule: active staff must be deactivated before they can be deleted
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();
  assert.strictEqual(await all.Delete(), 'StillActive');
  assert.strictEqual(await new clsStaff().Find(newNo), true);

  await tidyUp(all);
});

test('DeleteInactiveStaffOK', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  const newNo = await all.Add();
  await all.SetActive(false);
  assert.strictEqual(await all.Delete(), 'Deleted');
  assert.strictEqual(await new clsStaff().Find(newNo), false);
});

test('DeleteNotFound', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff.StaffNo = 999999;
  assert.strictEqual(await all.Delete(), 'NotFound');
});

// ---------- email must be unique ----------

test('EmailInUseFound', async () => {
  // alex@example.com belongs to staff member 1001 in the test data
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  all.ThisStaff.Email = 'alex@example.com';
  assert.strictEqual(await all.EmailInUse(), true);
});

test('EmailInUseIgnoresOwnRecord', async () => {
  // a staff member keeping their own email when editing is fine
  const s = new clsStaff();
  await s.Find(1001);
  const all = new clsStaffCollection();
  all.ThisStaff = s;
  assert.strictEqual(await all.EmailInUse(), false);
});

test('EmailInUseNewEmail', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  assert.strictEqual(await all.EmailInUse(), false);
});

test('DuplicateEmailBlockedByDatabase', async () => {
  // even without the EmailInUse check, the database refuses a second staff member with the same email
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  all.ThisStaff.Email = 'alex@example.com';
  await assert.rejects(() => all.Add(), (err) => err.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(err.message));
});

// ---------- search and filter ----------

test('FilterByNameOrEmailFound', async () => {
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('Jensen');
  assert.ok(all.Count >= 1);
  for (const s of all.StaffList) {
    assert.ok(s.FullName.includes('Jensen') || s.Email.includes('jensen'));
  }
});

test('FilterByEmailFound', async () => {
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('sam@example.com');
  assert.strictEqual(all.Count, 1);
});

test('FilterByNameOrEmailNoneFound', async () => {
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('xxxxxx');
  assert.strictEqual(all.Count, 0);
});

test('FilterActiveOnly', async () => {
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('', 'active');
  assert.ok(all.Count >= 1);
  for (const s of all.StaffList) assert.strictEqual(s.Active, true);
});

test('FilterInactiveOnly', async () => {
  // Jamie Lee is inactive in the test data
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('', 'inactive');
  assert.ok(all.Count >= 1);
  for (const s of all.StaffList) assert.strictEqual(s.Active, false);
});

test('FilterUnknownStatusShowsAll', async () => {
  const everyone = new clsStaffCollection();
  await everyone.LoadAll();
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail('', 'nonsense');
  assert.strictEqual(all.Count, everyone.Count);
});

// ---------- security ----------

test('FilterBlocksSqlInjection', async () => {
  // the search text is passed to the stored procedure as a parameter, never joined into SQL
  const all = new clsStaffCollection();
  await all.FilterByNameOrEmail("' OR '1'='1");
  assert.strictEqual(all.Count, 0);
});

test('ScriptInNameStoredAsPlainText', async () => {
  // a name containing HTML is saved as text; staff.js escapes it before showing it
  const scriptName = '<script>alert(1)</script>';
  const all = new clsStaffCollection();
  all.ThisStaff = makeStaff();
  all.ThisStaff.FullName = scriptName;
  const newNo = await all.Add();

  const found = new clsStaff();
  assert.strictEqual(await found.Find(newNo), true);
  assert.strictEqual(found.FullName, scriptName);

  await tidyUp(all);
});
