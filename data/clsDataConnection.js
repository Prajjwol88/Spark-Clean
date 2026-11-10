// Data layer: runs stored procedures in the sparkclean MySQL database
const mysql = require('mysql2/promise');
const config = require('../db.config');
const localData = require('./localData');

// true once MySQL could not be reached, so the backup data file is used instead
let useLocalData = false;

class clsDataConnection {
  constructor() {
    this.parameters = [];   // parameter values, in the same order as the stored procedure
    this.dataTable = [];    // rows returned by the last stored procedure
  }

  // adds a parameter value for the next stored procedure
  AddParameter(name, value) {
    this.parameters.push(value);
  }

  // runs a stored procedure, fills dataTable and returns the number of rows
  async Execute(storedProcedure) {
    if (useLocalData) return this.runLocal(storedProcedure);
    const placeholders = this.parameters.map(() => '?').join(', ');
    let connection;
    try {
      connection = await mysql.createConnection({ ...config, dateStrings: true });
    } catch (err) {
      // MySQL is not installed, not running, or the login/database is missing
      useLocalData = true;
      console.warn('Cannot connect to MySQL (' + err.code + ': ' + err.message + ').');
      console.warn('Using the backup data file data/stock.json instead. Set up MySQL to use the stored procedures.');
      return this.runLocal(storedProcedure);
    }
    try {
      const [results] = await connection.query(`CALL ${storedProcedure}(${placeholders})`, this.parameters);
      // a CALL returns [rows, info] when the procedure selects rows
      this.dataTable = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : [];
    } catch (err) {
      throw new Error(`Error running ${storedProcedure}: ${err.message}`);
    } finally {
      this.parameters = [];
      await connection.end();
    }
    return this.dataTable.length;
  }

  // runs the same procedure against the backup data file
  runLocal(storedProcedure) {
    try {
      this.dataTable = localData.call(storedProcedure, this.parameters);
    } finally {
      this.parameters = [];
    }
    return this.dataTable.length;
  }

  get Count() { return this.dataTable.length; }
}

module.exports = clsDataConnection;
