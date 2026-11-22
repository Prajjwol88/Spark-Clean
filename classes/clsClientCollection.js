
const clsDataConnection = require('../data/clsDataConnection');
const clsClient = require('./clsClient');

// Middle layer: manages the collection of clients
class clsClientCollection {
  constructor() {
    this.ClientList = [];
    this.ThisClient = new clsClient();
  }

  // Number of clients currently loaded
  get Count() {
    return this.ClientList.length;
  }

  // List all clients
  async LoadAll() {
    const db = new clsDataConnection();
    await db.Execute('sproc_tblClient_SelectAll', { allowLocal: false });
    this.populateArray(db);
  }

  // Search clients by name
  async FilterByName(name) {
    const db = new clsDataConnection();
    db.AddParameter('@Name', (name || '').trim());
    await db.Execute('sproc_tblClient_FilterByName', { allowLocal: false });
    this.populateArray(db);
  }

  // Add a new client
  async Add() {
    const db = new clsDataConnection();

    this.addDetailParameters(db);
    await db.Execute('sproc_tblClient_Insert', { allowLocal: false });

    this.ThisClient.ClientNo =
      Number(db.dataTable[0].ClientNo);

    return this.ThisClient.ClientNo;
  }

  // Update an existing client
  async Update() {
    const db = new clsDataConnection();

    db.AddParameter('@ClientNo', this.ThisClient.ClientNo);
    this.addDetailParameters(db);

    await db.Execute('sproc_tblClient_Update', { allowLocal: false });
    return Boolean(db.dataTable[0]?.Found);
  }

  // Deactivate an existing client (soft delete)
  async Delete() {
    return this.SetActive(false);
  }

  async SetActive(active) {
    const db = new clsDataConnection();
    db.AddParameter('@ClientNo', this.ThisClient.ClientNo);
    db.AddParameter('@Active', Number(active));
    await db.Execute('sproc_tblClient_SetActive', { allowLocal: false });
    return Boolean(db.dataTable[0]?.Found);
  }

  // Shared parameters for Add and Update
  addDetailParameters(db) {
    db.AddParameter('@FullName', this.ThisClient.FullName);
    db.AddParameter('@Email', this.ThisClient.Email);
    db.AddParameter('@Address', this.ThisClient.Address);
    db.AddParameter('@Postcode', this.ThisClient.Postcode);
  }

  // Convert database rows into clsClient objects
  populateArray(db) {
    this.ClientList = db.dataTable.map(row => {
      const client = new clsClient();
      client.loadFromRow(row);
      return client;
    });
  }
}

module.exports = clsClientCollection;
