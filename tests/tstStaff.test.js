// Tests for clsStaff: properties and the Valid method (no database needed)
// Valid is tested at the boundaries: extreme min, min-1, min, min+1, mid, max-1, max, max+1, extreme max
const { test } = require('node:test');
const assert = require('node:assert');
const clsStaff = require('../classes/clsStaff');

// good test data
const fullName = 'Alex Jensen';
const email = 'alex@example.com';
const phone = '12345678';
const jobRole = 'Cleaner';
const startDate = clsStaff.today();
const hourlyRate = '145.00';

const repeat = (n) => 'a'.repeat(n);
// an email address exactly n characters long
const emailOfLength = (n) => 'a'.repeat(n - '@example.com'.length) + '@example.com';
const addDays = (days) => {
  const d = new Date(); d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------- instance and properties ----------

test('InstanceOK', () => { assert.ok(new clsStaff()); });
test('StaffNoPropertyOK', () => { const s = new clsStaff(); s.StaffNo = 1001; assert.strictEqual(s.StaffNo, 1001); });
test('FullNamePropertyOK', () => { const s = new clsStaff(); s.FullName = 'Sam Taylor'; assert.strictEqual(s.FullName, 'Sam Taylor'); });
test('EmailPropertyOK', () => { const s = new clsStaff(); s.Email = 'sam@example.com'; assert.strictEqual(s.Email, 'sam@example.com'); });
test('PhonePropertyOK', () => { const s = new clsStaff(); s.Phone = '22334455'; assert.strictEqual(s.Phone, '22334455'); });
test('JobRolePropertyOK', () => { const s = new clsStaff(); s.JobRole = 'Supervisor'; assert.strictEqual(s.JobRole, 'Supervisor'); });
test('StartDatePropertyOK', () => { const s = new clsStaff(); s.StartDate = '2025-11-03'; assert.strictEqual(s.StartDate, '2025-11-03'); });
test('HourlyRatePropertyOK', () => { const s = new clsStaff(); s.HourlyRate = 190; assert.strictEqual(s.HourlyRate, 190); });
test('IsManagerPropertyOK', () => { const s = new clsStaff(); s.IsManager = true; assert.strictEqual(s.IsManager, true); });
test('ActivePropertyOK', () => { const s = new clsStaff(); s.Active = false; assert.strictEqual(s.Active, false); });
test('NewStaffIsActiveByDefault', () => { assert.strictEqual(new clsStaff().Active, true); });

// ---------- Valid: all good data ----------

test('ValidMethodOK', () => {
  assert.strictEqual(new clsStaff().Valid(fullName, email, phone, jobRole, startDate, hourlyRate), '');
});
test('ValidListsEveryProblem', () => {
  const error = new clsStaff().Valid('', '', '', '', '', '');
  assert.match(error, /full name/);
  assert.match(error, /email/);
  assert.match(error, /job role/);
  assert.match(error, /start date/);
  assert.match(error, /hourly rate/);
});

// ---------- FullName (1 to 100 characters) ----------

const vName = (n) => new clsStaff().Valid(n, email, phone, jobRole, startDate, hourlyRate);
test('FullNameMinLessOne', () => assert.notStrictEqual(vName(''), ''));
test('FullNameMin', () => assert.strictEqual(vName(repeat(1)), ''));
test('FullNameMinPlusOne', () => assert.strictEqual(vName(repeat(2)), ''));
test('FullNameMaxLessOne', () => assert.strictEqual(vName(repeat(99)), ''));
test('FullNameMax', () => assert.strictEqual(vName(repeat(100)), ''));
test('FullNameMaxPlusOne', () => assert.notStrictEqual(vName(repeat(101)), ''));
test('FullNameMid', () => assert.strictEqual(vName(repeat(50)), ''));
test('FullNameExtremeMax', () => assert.notStrictEqual(vName(repeat(1000)), ''));
test('FullNameOnlySpaces', () => assert.notStrictEqual(vName('   '), ''));

// ---------- Email (required, valid format, up to 150 characters) ----------

const vEmail = (e) => new clsStaff().Valid(fullName, e, phone, jobRole, startDate, hourlyRate);
test('EmailMinLessOne', () => assert.notStrictEqual(vEmail(''), ''));
test('EmailMin', () => assert.strictEqual(vEmail('a@b.c'), ''));
test('EmailMaxLessOne', () => assert.strictEqual(vEmail(emailOfLength(149)), ''));
test('EmailMax', () => assert.strictEqual(vEmail(emailOfLength(150)), ''));
test('EmailMaxPlusOne', () => assert.notStrictEqual(vEmail(emailOfLength(151)), ''));
test('EmailMid', () => assert.strictEqual(vEmail(emailOfLength(75)), ''));
test('EmailExtremeMax', () => assert.notStrictEqual(vEmail(emailOfLength(1000)), ''));
test('EmailNoAtSign', () => assert.notStrictEqual(vEmail('alex.example.com'), ''));
test('EmailNoDomain', () => assert.notStrictEqual(vEmail('alex@'), ''));
test('EmailWithSpace', () => assert.notStrictEqual(vEmail('alex jensen@example.com'), ''));

// ---------- Phone (optional, up to 20 characters, digits + - ( ) and spaces) ----------

const vPhone = (p) => new clsStaff().Valid(fullName, email, p, jobRole, startDate, hourlyRate);
test('PhoneBlankAllowed', () => assert.strictEqual(vPhone(''), ''));
test('PhoneMissingAllowed', () => assert.strictEqual(vPhone(undefined), ''));
test('PhoneMin', () => assert.strictEqual(vPhone('1'), ''));
test('PhoneMaxLessOne', () => assert.strictEqual(vPhone('1'.repeat(19)), ''));
test('PhoneMax', () => assert.strictEqual(vPhone('1'.repeat(20)), ''));
test('PhoneMaxPlusOne', () => assert.notStrictEqual(vPhone('1'.repeat(21)), ''));
test('PhoneMid', () => assert.strictEqual(vPhone('1'.repeat(10)), ''));
test('PhoneExtremeMax', () => assert.notStrictEqual(vPhone('1'.repeat(200)), ''));
test('PhoneInternationalFormatOK', () => assert.strictEqual(vPhone('+45 12 34-56 78'), ''));
test('PhoneLettersRejected', () => assert.notStrictEqual(vPhone('call me'), ''));

// ---------- JobRole (1 to 50 characters) ----------

const vRole = (r) => new clsStaff().Valid(fullName, email, phone, r, startDate, hourlyRate);
test('JobRoleMinLessOne', () => assert.notStrictEqual(vRole(''), ''));
test('JobRoleMin', () => assert.strictEqual(vRole(repeat(1)), ''));
test('JobRoleMinPlusOne', () => assert.strictEqual(vRole(repeat(2)), ''));
test('JobRoleMaxLessOne', () => assert.strictEqual(vRole(repeat(49)), ''));
test('JobRoleMax', () => assert.strictEqual(vRole(repeat(50)), ''));
test('JobRoleMaxPlusOne', () => assert.notStrictEqual(vRole(repeat(51)), ''));
test('JobRoleMid', () => assert.strictEqual(vRole(repeat(25)), ''));
test('JobRoleExtremeMax', () => assert.notStrictEqual(vRole(repeat(500)), ''));

// ---------- StartDate (2000-01-01 to today) ----------

const vDate = (d) => new clsStaff().Valid(fullName, email, phone, jobRole, d, hourlyRate);
test('StartDateExtremeMin', () => assert.notStrictEqual(vDate('1900-01-01'), ''));
test('StartDateMinLessOne', () => assert.notStrictEqual(vDate('1999-12-31'), ''));
test('StartDateMin', () => assert.strictEqual(vDate('2000-01-01'), ''));
test('StartDateMinPlusOne', () => assert.strictEqual(vDate('2000-01-02'), ''));
test('StartDateMid', () => assert.strictEqual(vDate('2013-06-15'), ''));
test('StartDateMaxLessOne', () => assert.strictEqual(vDate(addDays(-1)), ''));
test('StartDateMax', () => assert.strictEqual(vDate(addDays(0)), ''));
test('StartDateMaxPlusOne', () => assert.notStrictEqual(vDate(addDays(1)), ''));
test('StartDateExtremeMax', () => assert.notStrictEqual(vDate(addDays(36500)), ''));
test('StartDateInvalidData', () => assert.notStrictEqual(vDate('not a date'), ''));
test('StartDateNotARealDay', () => assert.notStrictEqual(vDate('2025-02-30'), ''));

// ---------- HourlyRate (0.01 to 999.99, at most 2 decimal places) ----------

const vRate = (r) => new clsStaff().Valid(fullName, email, phone, jobRole, startDate, r);
test('HourlyRateExtremeMin', () => assert.notStrictEqual(vRate('-1000'), ''));
test('HourlyRateMinLessOne', () => assert.notStrictEqual(vRate('0.00'), ''));
test('HourlyRateMin', () => assert.strictEqual(vRate('0.01'), ''));
test('HourlyRateMinPlusOne', () => assert.strictEqual(vRate('0.02'), ''));
test('HourlyRateMid', () => assert.strictEqual(vRate('500.00'), ''));
test('HourlyRateMaxLessOne', () => assert.strictEqual(vRate('999.98'), ''));
test('HourlyRateMax', () => assert.strictEqual(vRate('999.99'), ''));
test('HourlyRateMaxPlusOne', () => assert.notStrictEqual(vRate('1000.00'), ''));
test('HourlyRateExtremeMax', () => assert.notStrictEqual(vRate('99999999'), ''));
test('HourlyRateWholeNumberOK', () => assert.strictEqual(vRate('145'), ''));
test('HourlyRateThreeDecimalPlaces', () => assert.notStrictEqual(vRate('145.555'), ''));
test('HourlyRateInvalidData', () => assert.notStrictEqual(vRate('abc'), ''));
test('HourlyRateBlank', () => assert.notStrictEqual(vRate(''), ''));
