// Middle layer: the list of products in tblStock
const clsDataConnection = require('../data/clsDataConnection');
const clsStock = require('./clsStock');

class clsStockCollection {
  constructor() {
    this.StockList = [];             // the products currently loaded
    this.ThisStock = new clsStock(); // the product to add, update or delete
  }

  get Count() { return this.StockList.length; }

  // loads every product
  async LoadAll() {
    const db = new clsDataConnection();
    await db.Execute('sproc_tblStock_SelectAll');
    this.populateArray(db);
  }

  // adds ThisStock to the database and returns its new product number
  async Add() {
    const db = new clsDataConnection();
    this.addDetailParameters(db);
    await db.Execute('sproc_tblStock_Insert');
    this.ThisStock.ProductNo = Number(db.dataTable[0].ProductNo);
    await this.saveHazardWarning();
    return this.ThisStock.ProductNo;
  }

  // updates ThisStock in the database
  async Update() {
    const db = new clsDataConnection();
    db.AddParameter('@ProductNo', this.ThisStock.ProductNo);
    this.addDetailParameters(db);
    await db.Execute('sproc_tblStock_Update');
    await this.saveHazardWarning();
  }

  // saves the hazard warning of ThisStock (Sprint 5 upgrade)
  async saveHazardWarning() {
    const db = new clsDataConnection();
    db.AddParameter('@ProductNo', this.ThisStock.ProductNo);
    db.AddParameter('@HazardWarning', (this.ThisStock.HazardWarning || '').trim());
    await db.Execute('sproc_tblStock_UpdateHazard');
  }

  // deletes ThisStock; if it is on an order it is marked unavailable instead
  // returns "Deleted" or "MarkedUnavailable"
  async Delete() {
    const db = new clsDataConnection();
    db.AddParameter('@ProductNo', this.ThisStock.ProductNo);
    await db.Execute('sproc_tblStock_Delete');
    return db.dataTable[0].Result;
  }

  // filters to products whose name or category contains the text
  async ReportByNameOrCategory(filter) {
    const db = new clsDataConnection();
    db.AddParameter('@Filter', (filter || '').trim());
    await db.Execute('sproc_tblStock_FilterByNameOrCategory');
    this.populateArray(db);
  }

  // filters to products a customer can buy (available and in stock)
  async ReportAvailable(filter) {
    const db = new clsDataConnection();
    db.AddParameter('@Filter', (filter || '').trim());
    await db.Execute('sproc_tblStock_SelectAvailable');
    this.populateArray(db);
  }

  // filters to products at or below the given quantity
  async LowStockReport(level) {
    const db = new clsDataConnection();
    db.AddParameter('@Level', level);
    await db.Execute('sproc_tblStock_LowStock');
    this.populateArray(db);
  }

  // the six detail parameters shared by Insert and Update, in order
  addDetailParameters(db) {
    db.AddParameter('@ProductName', this.ThisStock.ProductName);
    db.AddParameter('@Category', this.ThisStock.Category);
    db.AddParameter('@Price', this.ThisStock.Price);
    db.AddParameter('@QuantityInStock', this.ThisStock.QuantityInStock);
    db.AddParameter('@DateAdded', this.ThisStock.DateAdded);
    db.AddParameter('@Available', this.ThisStock.Available ? 1 : 0);
  }

  // copies every returned row into StockList
  populateArray(db) {
    this.StockList = db.dataTable.map((row) => {
      const product = new clsStock();
      product.loadFromRow(row);
      return product;
    });
  }
}

module.exports = clsStockCollection;
