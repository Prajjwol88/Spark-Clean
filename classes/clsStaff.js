// Middle layer: one staff member in tblStaff (Staff Management component)
const clsDataConnection = require('../data/clsDataConnection');

class clsStaff {
  constructor() {
    this.StaffNo = 0;          // primary key
    this.FullName = '';        // text, up to 100 characters
    this.Email = '';           // text, up to 150 characters, must be unique
    this.Phone = '';           // text, up to 20 characters, optional (blank = none)
    this.JobRole = '';         // text, up to 50 characters
    this.StartDate = '';       // date as yyyy-mm-dd
    this.HourlyRate = 0;       // decimal, 0.01 to 999.99 DKK
    this.IsManager = false;    // boolean
    this.Active = true;        // boolean, inactive staff are kept for records
  }

  // finds one staff member by their staff number; returns true if found
  async Find(staffNo) {
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', staffNo);
    await db.Execute('sproc_tblStaff_FilterByStaffNo');
    if (db.Count === 1) {
      this.loadFromRow(db.dataTable[0]);
      return true;
    }
    return false;
  }

  // copies one database row into this object
  loadFromRow(row) {
    this.StaffNo = Number(row.StaffNo);
    this.FullName = row.FullName;
    this.Email = row.Email;
    this.Phone = row.Phone || '';
    this.JobRole = row.JobRole;
    this.StartDate = String(row.StartDate).substring(0, 10);
    this.HourlyRate = Number(row.HourlyRate);
    this.IsManager = Boolean(Number(row.IsManager));
    this.Active = Boolean(Number(row.Active));
  }

  // checks the values typed in by the manager
  // returns "" if valid, otherwise a message listing every problem
  Valid(fullName, email, phone, jobRole, startDate, hourlyRate) {
    let error = '';
    const text = (v) => (v === undefined || v === null ? '' : String(v).trim());

    // full name: required, at most 100 characters
    const name = text(fullName);
    if (name === '') error += 'The full name may not be blank. ';
    else if (name.length > 100) error += 'The full name must be 100 characters or fewer. ';

    // email: required, at most 150 characters, must look like an email address
    const mail = text(email);
    if (mail === '') error += 'The email may not be blank. ';
    else if (mail.length > 150) error += 'The email must be 150 characters or fewer. ';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) error += 'The email must be a valid email address. ';

    // phone: optional, at most 20 characters, only digits, spaces, + - ( )
    const tel = text(phone);
    if (tel.length > 20) error += 'The phone number must be 20 characters or fewer. ';
    else if (tel !== '' && !/^[0-9+\-() ]+$/.test(tel)) error += 'The phone number may only contain digits, spaces and + - ( ). ';

    // job role: required, at most 50 characters
    const role = text(jobRole);
    if (role === '') error += 'The job role may not be blank. ';
    else if (role.length > 50) error += 'The job role must be 50 characters or fewer. ';

    // start date: a real date, not in the future and not before 2000
    const d = text(startDate);
    if (!isRealDate(d)) error += 'The start date must be a valid date (yyyy-mm-dd). ';
    else if (d > today()) error += 'The start date may not be in the future. ';
    else if (d < '2000-01-01') error += 'The start date may not be before 2000. ';

    // hourly rate: a number from 0.01 to 999.99 with at most 2 decimal places
    const r = text(hourlyRate);
    if (!/^-?\d+(\.\d+)?$/.test(r)) error += 'The hourly rate must be a number. ';
    else if (Number(r) <= 0) error += 'The hourly rate must be more than 0. ';
    else if (Number(r) > 999.99) error += 'The hourly rate must be 999.99 or less. ';
    else if (r.includes('.') && r.split('.')[1].length > 2) error += 'The hourly rate may have at most 2 decimal places. ';

    return error.trim();
  }

  // checks only the phone number (used when staff change their own phone number)
  // returns "" if valid, otherwise the problem
  ValidPhone(phone) {
    const tel = phone === undefined || phone === null ? '' : String(phone).trim();
    if (tel.length > 20) return 'The phone number must be 20 characters or fewer.';
    if (tel !== '' && !/^[0-9+\-() ]+$/.test(tel)) return 'The phone number may only contain digits, spaces and + - ( ).';
    return '';
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

clsStaff.today = today;
module.exports = clsStaff;
