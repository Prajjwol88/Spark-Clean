// Middle layer: the list of staff members in tblStaff (Staff Management component)
// If MySQL cannot be reached, the backup data file data/stock.json is used, like Stock Management.
const clsDataConnection = require('../data/clsDataConnection');
const clsStaff = require('./clsStaff');

// the status filters the search accepts
const STATUSES = ['all', 'active', 'inactive'];

class clsStaffCollection {
  constructor() {
    this.StaffList = [];             // the staff members currently loaded
    this.ThisStaff = new clsStaff(); // the staff member to add, update, activate or delete
  }

  get Count() { return this.StaffList.length; }

  // loads every staff member
  async LoadAll() {
    const db = new clsDataConnection();
    await db.Execute('sproc_tblStaff_SelectAll');
    this.populateArray(db);
  }

  // filters to staff whose name or email contains the text, with the given status
  async FilterByNameOrEmail(filter, status = 'all') {
    const db = new clsDataConnection();
    db.AddParameter('@Filter', (filter || '').trim());
    db.AddParameter('@Status', STATUSES.includes(status) ? status : 'all');
    await db.Execute('sproc_tblStaff_FilterByNameOrEmail');
    this.populateArray(db);
  }

  // true if another staff member already uses the email of ThisStaff
  async EmailInUse() {
    const db = new clsDataConnection();
    db.AddParameter('@Email', (this.ThisStaff.Email || '').trim());
    db.AddParameter('@StaffNo', Number(this.ThisStaff.StaffNo) || 0);
    await db.Execute('sproc_tblStaff_EmailInUse');
    return Number(db.dataTable[0]?.InUse) === 1;
  }

  // adds ThisStaff to the database (as active) and returns their new staff number
  async Add() {
    const db = new clsDataConnection();
    this.addDetailParameters(db);
    await db.Execute('sproc_tblStaff_Insert');
    this.ThisStaff.StaffNo = Number(db.dataTable[0].StaffNo);
    this.ThisStaff.Active = true;
    return this.ThisStaff.StaffNo;
  }

  // updates the details of ThisStaff; returns false if they were not found
  async Update() {
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', this.ThisStaff.StaffNo);
    this.addDetailParameters(db);
    await db.Execute('sproc_tblStaff_Update');
    return Number(db.dataTable[0]?.Found) === 1;
  }

  // activates or deactivates ThisStaff; returns false if they were not found
  async SetActive(active) {
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', this.ThisStaff.StaffNo);
    db.AddParameter('@Active', active ? 1 : 0);
    await db.Execute('sproc_tblStaff_SetActive');
    const found = Number(db.dataTable[0]?.Found) === 1;
    if (found) this.ThisStaff.Active = Boolean(active);
    return found;
  }

  // deletes ThisStaff; an active staff member is never deleted (deactivate them first)
  // returns "Deleted", "StillActive" or "NotFound"
  async Delete() {
    const db = new clsDataConnection();
    db.AddParameter('@StaffNo', this.ThisStaff.StaffNo);
    await db.Execute('sproc_tblStaff_Delete');
    return db.dataTable[0].Result;
  }

  // the seven detail parameters shared by Insert and Update, in order
  addDetailParameters(db) {
    db.AddParameter('@FullName', this.ThisStaff.FullName);
    db.AddParameter('@Email', this.ThisStaff.Email);
    db.AddParameter('@Phone', this.ThisStaff.Phone || '');
    db.AddParameter('@JobRole', this.ThisStaff.JobRole);
    db.AddParameter('@StartDate', this.ThisStaff.StartDate);
    db.AddParameter('@HourlyRate', this.ThisStaff.HourlyRate);
    db.AddParameter('@IsManager', this.ThisStaff.IsManager ? 1 : 0);
  }

  // copies every returned row into StaffList
  populateArray(db) {
    this.StaffList = db.dataTable.map((row) => {
      const staff = new clsStaff();
      staff.loadFromRow(row);
      return staff;
    });
  }
}

clsStaffCollection.STATUSES = STATUSES;
module.exports = clsStaffCollection;
