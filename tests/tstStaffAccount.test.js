// Tests for staff login (clsStaffAccount) and staff changing their own phone number (Staff Management - Sushil)
// The password rule tests need no database. The other tests need the sparkclean database
// with database/05_staff_management.sql and 06_staff_login.sql loaded (SETUP_ALL.sql includes both).
// Every test removes the staff members it adds and puts back any password it changes.
const { test } = require('node:test');
const assert = require('node:assert');
const clsStaff = require('../classes/clsStaff');
const clsStaffCollection = require('../classes/clsStaffCollection');
const clsStaffAccount = require('../classes/clsStaffAccount');

const DEMO_PASSWORD = 'Staff2026!';   // the test staff password in 06_staff_login.sql

// adds a temporary active staff member and returns the collection holding them
let counter = 0;
async function addTestStaff() {
  const all = new clsStaffCollection();
  all.ThisStaff.FullName = 'Login Test';
  all.ThisStaff.Email = `login.test.${Date.now()}.${counter++}@example.com`;
  all.ThisStaff.Phone = '12345678';
  all.ThisStaff.JobRole = 'Tester';
  all.ThisStaff.StartDate = clsStaff.today();
  all.ThisStaff.HourlyRate = 150;
  all.ThisStaff.IsManager = false;
  await all.Add();
  return all;
}
async function removeTestStaff(all) {
  await all.SetActive(false);
  await all.Delete();
}

// ---------- properties (no database) ----------

test('InstanceOK', () => { assert.ok(new clsStaffAccount()); });
test('StaffNoPropertyOK', () => { const a = new clsStaffAccount(); a.StaffNo = 1001; assert.strictEqual(a.StaffNo, 1001); });
test('IsManagerPropertyOK', () => { const a = new clsStaffAccount(); a.IsManager = true; assert.strictEqual(a.IsManager, true); });
test('NewAccountNotActiveUntilLoaded', () => { assert.strictEqual(new clsStaffAccount().Active, false); });

// ---------- ValidPassword: 8 to 50 characters, at least one letter and one number ----------

const vPass = (p) => new clsStaffAccount().ValidPassword(p);
test('PasswordBlank', () => assert.notStrictEqual(vPass(''), ''));
test('PasswordMissing', () => assert.notStrictEqual(vPass(undefined), ''));
test('PasswordMinLessOne', () => assert.notStrictEqual(vPass('abcdef1'), ''));     // 7 characters
test('PasswordMin', () => assert.strictEqual(vPass('abcdefg1'), ''));             // 8
test('PasswordMinPlusOne', () => assert.strictEqual(vPass('abcdefgh1'), ''));     // 9
test('PasswordMid', () => assert.strictEqual(vPass('a1'.repeat(12) + 'a'), ''));   // 25
test('PasswordMaxLessOne', () => assert.strictEqual(vPass('a'.repeat(48) + '1'), ''));   // 49
test('PasswordMax', () => assert.strictEqual(vPass('a'.repeat(49) + '1'), ''));          // 50
test('PasswordMaxPlusOne', () => assert.notStrictEqual(vPass('a'.repeat(50) + '1'), ''));  // 51
test('PasswordExtremeMax', () => assert.notStrictEqual(vPass('a1'.repeat(500)), ''));
test('PasswordNoNumber', () => assert.notStrictEqual(vPass('abcdefgh'), ''));
test('PasswordNoLetter', () => assert.notStrictEqual(vPass('12345678'), ''));
test('PasswordWithSymbolsOK', () => assert.strictEqual(vPass(DEMO_PASSWORD), ''));

// ---------- ValidPhone (staff changing their own phone number) ----------

const vPhone = (p) => new clsStaff().ValidPhone(p);
test('OwnPhoneBlankAllowed', () => assert.strictEqual(vPhone(''), ''));
test('OwnPhoneMax', () => assert.strictEqual(vPhone('1'.repeat(20)), ''));
test('OwnPhoneMaxPlusOne', () => assert.notStrictEqual(vPhone('1'.repeat(21)), ''));
test('OwnPhoneLettersRejected', () => assert.notStrictEqual(vPhone('call me'), ''));
test('OwnPhoneInternationalOK', () => assert.strictEqual(vPhone('+45 12 34-56 78'), ''));

// ---------- login (database) ----------

test('ManagerLoginOK', async () => {
  // Sam Taylor is an active manager in the test data
  const a = new clsStaffAccount();
  assert.strictEqual(await a.Login('sam@example.com', DEMO_PASSWORD), true);
  assert.strictEqual(a.IsManager, true);
  assert.strictEqual(a.FullName, 'Sam Taylor');
});

test('StaffLoginOK', async () => {
  // Alex Jensen is active but not a manager
  const a = new clsStaffAccount();
  assert.strictEqual(await a.Login('alex@example.com', DEMO_PASSWORD), true);
  assert.strictEqual(a.IsManager, false);
});

test('LoginEmailIgnoresCapitalsAndSpaces', async () => {
  assert.strictEqual(await new clsStaffAccount().Login('  ALEX@Example.com ', DEMO_PASSWORD), true);
});

test('LoginWrongPasswordRefused', async () => {
  assert.strictEqual(await new clsStaffAccount().Login('alex@example.com', 'WrongPass1'), false);
});

test('LoginBlankPasswordRefused', async () => {
  assert.strictEqual(await new clsStaffAccount().Login('alex@example.com', ''), false);
});

test('LoginUnknownEmailRefused', async () => {
  assert.strictEqual(await new clsStaffAccount().Login('nobody@example.com', DEMO_PASSWORD), false);
});

test('InactiveStaffCannotLogIn', async () => {
  // Jamie Lee is inactive in the test data
  const a = new clsStaffAccount();
  assert.strictEqual(await a.Login('jamie@example.com', DEMO_PASSWORD), false);
  assert.strictEqual(a.Active, false);
});

test('LoginRecordsLastLogin', async () => {
  const a = new clsStaffAccount();
  await a.Login('freja@example.com', DEMO_PASSWORD);
  await a.FindByEmail('freja@example.com');
  assert.ok(a.LastLogin !== null);
});

test('PasswordStoredAsHashNotPlainText', async () => {
  const a = new clsStaffAccount();
  await a.FindByEmail('alex@example.com');
  assert.ok(!a.PasswordHash.includes(DEMO_PASSWORD));
  assert.match(a.PasswordHash, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test('LoginBlocksSqlInjection', async () => {
  // the email is passed to the stored procedure as a parameter, never joined into SQL
  assert.strictEqual(await new clsStaffAccount().Login("' OR '1'='1", "' OR '1'='1"), false);
});

// ---------- setting passwords (database) ----------

test('SetPasswordThenLoginOK', async () => {
  const all = await addTestStaff();
  const a = new clsStaffAccount();
  assert.strictEqual(await a.Login(all.ThisStaff.Email, 'NewPass123'), false);   // no account yet
  assert.strictEqual(await a.SetPassword(all.ThisStaff.StaffNo, 'NewPass123'), true);
  assert.strictEqual(await a.Login(all.ThisStaff.Email, 'NewPass123'), true);
  await removeTestStaff(all);
});

test('ChangePasswordOldOneStopsWorking', async () => {
  const all = await addTestStaff();
  const a = new clsStaffAccount();
  await a.SetPassword(all.ThisStaff.StaffNo, 'FirstPass1');
  await a.SetPassword(all.ThisStaff.StaffNo, 'SecondPass2');
  assert.strictEqual(await a.Login(all.ThisStaff.Email, 'FirstPass1'), false);
  assert.strictEqual(await a.Login(all.ThisStaff.Email, 'SecondPass2'), true);
  await removeTestStaff(all);
});

test('SetPasswordUnknownStaffRefused', async () => {
  assert.strictEqual(await new clsStaffAccount().SetPassword(999999, 'NewPass123'), false);
});

test('DeactivatedStaffLoseLogin', async () => {
  const all = await addTestStaff();
  const a = new clsStaffAccount();
  await a.SetPassword(all.ThisStaff.StaffNo, 'NewPass123');
  await all.SetActive(false);
  assert.strictEqual(await a.Login(all.ThisStaff.Email, 'NewPass123'), false);
  await all.Delete();
});

test('DeletingStaffDeletesAccount', async () => {
  const all = await addTestStaff();
  const a = new clsStaffAccount();
  await a.SetPassword(all.ThisStaff.StaffNo, 'NewPass123');
  await removeTestStaff(all);
  assert.strictEqual(await new clsStaffAccount().FindByEmail(all.ThisStaff.Email), false);
});

// ---------- staff changing their own phone number (database) ----------

test('UpdatePhoneOK', async () => {
  const all = await addTestStaff();
  all.ThisStaff.Phone = '+45 99 88 77 66';
  assert.strictEqual(await all.UpdatePhone(), true);
  const found = new clsStaff();
  await found.Find(all.ThisStaff.StaffNo);
  assert.strictEqual(found.Phone, '+45 99 88 77 66');
  assert.strictEqual(found.FullName, 'Login Test');   // nothing else changed
  await removeTestStaff(all);
});

test('UpdatePhoneNotFound', async () => {
  const all = new clsStaffCollection();
  all.ThisStaff.StaffNo = 999999;
  all.ThisStaff.Phone = '12345678';
  assert.strictEqual(await all.UpdatePhone(), false);
});
