// Middle layer: the stock change log (Sprint 5 upgrade)
// Every add, edit and delete made by the Stock Manager is recorded in tblStockLog,
// so it is clear who changed a product and when.
const clsDataConnection = require('../data/clsDataConnection');

// the actions that can be recorded
const ACTIONS = ['Added', 'Updated', 'Deleted', 'MarkedUnavailable'];

class clsStockLog {
  constructor() {
    this.LogList = [];   // the log entries currently loaded, newest first
  }

  get Count() { return this.LogList.length; }

  // checks the values for one log entry; returns "" if valid, otherwise the problems
  Valid(productNo, action, productName, changedBy) {
    let error = '';
    if (!Number.isInteger(Number(productNo)) || Number(productNo) < 1) error += 'The product number must be a whole number of 1 or more. ';
    if (!ACTIONS.includes(action)) error += 'The action must be Added, Updated, Deleted or MarkedUnavailable. ';
    const name = String(productName || '').trim();
    if (name === '' || name.length > 50) error += 'The product name must be 1 to 50 characters. ';
    const by = String(changedBy || '').trim();
    if (by === '' || by.length > 50) error += 'Changed by must be 1 to 50 characters. ';
    return error.trim();
  }

  // records one change and returns its new log number
  async Add(productNo, action, productName, changedBy) {
    const error = this.Valid(productNo, action, productName, changedBy);
    if (error) throw new Error(error);
    const db = new clsDataConnection();
    db.AddParameter('@ProductNo', Number(productNo));
    db.AddParameter('@Action', action);
    db.AddParameter('@ProductName', String(productName).trim());
    db.AddParameter('@ChangedBy', String(changedBy).trim());
    await db.Execute('sproc_tblStockLog_Insert');
    return Number(db.dataTable[0].LogNo);
  }

  // loads every log entry, newest first
  async LoadAll() {
    const db = new clsDataConnection();
    await db.Execute('sproc_tblStockLog_SelectAll');
    this.LogList = db.dataTable.map((row) => ({
      LogNo: Number(row.LogNo),
      ProductNo: Number(row.ProductNo),
      Action: row.Action,
      ProductName: row.ProductName,
      ChangedBy: row.ChangedBy,
      ChangedAt: String(row.ChangedAt)
    }));
  }
}

// name used by the automated tests, so their entries can be tidied up afterwards
clsStockLog.TEST_USER = 'Automated test';

// removes only the entries written by the automated tests (real entries are never deleted)
clsStockLog.DeleteTestEntries = async function () {
  const db = new clsDataConnection();
  await db.Execute('sproc_tblStockLog_DeleteTestEntries');
};

clsStockLog.ACTIONS = ACTIONS;
module.exports = clsStockLog;
