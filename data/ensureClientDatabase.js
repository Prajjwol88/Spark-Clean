// Install missing Client Management database objects on startup.
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const config = require('../db.config');

function readSql(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'database', name), 'utf8');
}

async function ensureClientDatabase() {
  // Only CREATE statements for the client component are selected.
  const table = readSql('01_tables.sql').match(/CREATE TABLE IF NOT EXISTS tblclient\s*\([\s\S]*?\);/i);
  const procedures = [...readSql('03_stored_procedures.sql').matchAll(
    /CREATE PROCEDURE (sproc_tblClient_\w+)\s*\([\s\S]*?\bEND\s*\$+/gi
  )];

  if (!table || procedures.length !== 7) {
    throw new Error('Client database setup scripts are incomplete.');
  }

  const connection = await mysql.createConnection(config);
  try {
    await connection.query(table[0]);
    const [existing] = await connection.query(
      'SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = ?',
      ['PROCEDURE']
    );
    const installed = new Set(existing.map(row => row.ROUTINE_NAME.toLowerCase()));

    for (const [statement, name] of procedures) {
      if (installed.has(name.toLowerCase())) continue;
      try {
        await connection.query(statement.replace(/\$+$/, ''));
        console.log('Installed client procedure:', name);
      } catch (error) {
        // Another app instance may have installed it concurrently.
        if (error.code !== 'ER_SP_ALREADY_EXISTS') throw error;
      }
    }
    console.log('Client Management database is ready.');
  } finally {
    await connection.end();
  }
}

module.exports = ensureClientDatabase;
