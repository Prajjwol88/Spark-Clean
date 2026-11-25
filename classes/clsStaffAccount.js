// Middle layer: staff login accounts in tblStaffAccount (Staff Management component - Sushil)
// Every staff member logs in with their own email address and password.
// Passwords are hashed with the same salted scrypt method as clsStaffLogin, never stored as plain text.
const clsDataConnection = require('../data/clsDataConnection');
const clsStaffLogin = require('./clsStaffLogin');

class clsStaffAccount {
  constructor() {
    this.StaffNo = 0;          // primary key, also the foreign key to tblStaff
    this.FullName = '';        // copied from tblStaff for the "Logged in as" message
    this.Email = '';           // the login name
    this.IsManager = false;    // managers can use Staff Management
    this.Active = false;       // inactive staff cannot log in
    this.PasswordHash = '';    // "salt:hash"
    this.LastLogin = null;     // date and time of the last successful login
  }

  // finds the login account for an email address; returns true if found
  async FindByEmail(email) {
    const db = new clsDataConnection();
    db.AddParameter('@Email', String(email || '').trim().toLowerCase());
    await db.Execute('sproc_tblStaffAccount_FilterByEmail');
    if (db.Count !== 1) return false;
    const row = db.dataTable[0];
    this.StaffNo = Number(row.StaffNo);
    this.FullName = row.FullName;
    this.Email = row.Email;
    this.IsManager = Boolean(Number(row.IsManager));
    this.Active = Boolean(Number(row.Active));
    this.PasswordHash = row.PasswordHash;
    this.LastLogin = row.LastLogin || null;
    return true;
  }

  // checks an email and password; returns true only for an ACTIVE staff member with the right password
  async Login(email, password) {
    if (!(await this.FindByEmail(email))) return false;
    if (!this.Active) return false;
    if (!clsStaffLogin.CheckPassword(password, this.PasswordHash)) return false;
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', this.StaffNo);
    await db.Execute('sproc_tblStaffAccount_RecordLogin');
    return true;
  }

  // saves a new password for a staff member (hashed first); returns false if the staff member does not exist
  async SetPassword(staffNo, password) {
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', Number(staffNo));
    db.AddParameter('@PasswordHash', clsStaffLogin.HashPassword(password));
    await db.Execute('sproc_tblStaffAccount_SetPassword');
    return Number(db.dataTable[0]?.Found) === 1;
  }

  // checks a new password; returns "" if it is acceptable, otherwise the problem
  // rules: 8 to 50 characters, with at least one letter and at least one number
  ValidPassword(password) {
    const p = password === undefined || password === null ? '' : String(password);
    if (p.length < 8) return 'The password must be at least 8 characters.';
    if (p.length > 50) return 'The password must be 50 characters or fewer.';
    if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'The password must contain at least one letter and one number.';
    return '';
  }
}

module.exports = clsStaffAccount;
