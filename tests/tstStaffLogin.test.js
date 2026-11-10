// Tests for clsStaffLogin: only the Stock Manager can log in
const { test } = require('node:test');
const assert = require('node:assert');
const clsStaffLogin = require('../classes/clsStaffLogin');

const account = { username: 'bibek', passwordHash: clsStaffLogin.HashPassword('Stock2026!') };

test('HashIsNotThePassword', () => {
  assert.ok(!account.passwordHash.includes('Stock2026!'));
});
test('SamePasswordGivesDifferentHash', () => {
  assert.notStrictEqual(clsStaffLogin.HashPassword('Stock2026!'), clsStaffLogin.HashPassword('Stock2026!'));
});
test('OwnerLoginOK', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('bibek', 'Stock2026!', account), true);
});
test('OwnerLoginIgnoresCaseOfUsername', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('Bibek', 'Stock2026!', account), true);
});
test('WrongPasswordRejected', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('bibek', 'stock2026!', account), false);
});
test('TeamMemberPrajjwolRejected', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('prajjwol', 'Stock2026!', account), false);
});
test('TeamMemberSushilRejected', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('sushil', 'Stock2026!', account), false);
});
test('BlankLoginRejected', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('', '', account), false);
});
test('OldSharedLoginRejected', () => {
  assert.strictEqual(clsStaffLogin.CheckLogin('staff', 'sparkclean123', account), false);
});
