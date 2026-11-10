// BACKUP DATA LAYER - only used when the MySQL database cannot be reached.
// It copies what each stored procedure does, but saves the data in data/stock.json
// so the website still works for a demo. Set up MySQL to use the real stored procedures.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'stock.json');

// same test data as database/02_test_data.sql
const testData = {
  nextProductNo: 11,
  orderLines: [{ OrderNo: 1, ProductNo: 1, Quantity: 2 }],
  stock: [
    ['Multi-Surface Spray 750ml', 'Sprays', 2.49, 40, '2026-10-01', 1],
    ['Glass Cleaner 500ml', 'Sprays', 1.99, 25, '2026-10-01', 1],
    ['Floor Cleaner 1L', 'Floor Care', 3.75, 18, '2026-10-05', 1],
    ['Washing Up Liquid 900ml', 'Kitchen', 1.5, 60, '2026-10-05', 1],
    ['Laundry Detergent 2L', 'Laundry', 6.99, 12, '2026-10-10', 1],
    ['Microfibre Cloths (5 pack)', 'Cloths', 4.25, 4, '2026-10-12', 1],
    ['Spin Mop and Bucket', 'Floor Care', 19.99, 3, '2026-10-15', 1],
    ['Toilet Cleaner Gel 750ml', 'Bathroom', 1.89, 35, '2026-10-18', 1],
    ['Oven Cleaner 500ml', 'Kitchen', 4.49, 0, '2026-10-20', 1],
    ['Bleach 1L (old stock)', 'Bathroom', 0.99, 10, '2026-09-01', 0]
  ].map((p, i) => ({
    ProductNo: i + 1, ProductName: p[0], Category: p[1], Price: p[2],
    QuantityInStock: p[3], DateAdded: p[4], Available: p[5]
  }))
};

function load() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(testData, null, 2));
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function save(data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const byName = (a, b) => a.ProductName.localeCompare(b.ProductName);
const matches = (p, f) => {
  const text = String(f || '').toLowerCase();
  return p.ProductName.toLowerCase().includes(text) || p.Category.toLowerCase().includes(text);
};

// runs the stored procedure with the same name and returns its rows
function call(storedProcedure, params) {
  const data = load();
  const s = data.stock;
  switch (storedProcedure) {
    case 'sproc_tblStock_SelectAll':
      return [...s].sort(byName);
    case 'sproc_tblStock_FilterByProductNo':
      return s.filter((p) => p.ProductNo === Number(params[0]));
    case 'sproc_tblStock_FilterByNameOrCategory':
      return s.filter((p) => matches(p, params[0])).sort(byName);
    case 'sproc_tblStock_SelectAvailable':
      return s.filter((p) => p.Available && p.QuantityInStock > 0 && matches(p, params[0])).sort(byName);
    case 'sproc_tblStock_LowStock':
      return s.filter((p) => p.QuantityInStock <= Number(params[0]))
        .sort((a, b) => a.QuantityInStock - b.QuantityInStock || byName(a, b));
    case 'sproc_tblStock_Insert': {
      const [ProductName, Category, Price, QuantityInStock, DateAdded, Available] = params;
      const ProductNo = data.nextProductNo++;
      s.push({ ProductNo, ProductName, Category, Price: Number(Price),
        QuantityInStock: Number(QuantityInStock), DateAdded, Available: Available ? 1 : 0 });
      save(data);
      return [{ ProductNo }];
    }
    case 'sproc_tblStock_Update': {
      const [ProductNo, ProductName, Category, Price, QuantityInStock, DateAdded, Available] = params;
      const p = s.find((x) => x.ProductNo === Number(ProductNo));
      if (p) Object.assign(p, { ProductName, Category, Price: Number(Price),
        QuantityInStock: Number(QuantityInStock), DateAdded, Available: Available ? 1 : 0 });
      save(data);
      return [];
    }
    case 'sproc_tblStock_Delete': {
      const no = Number(params[0]);
      if (data.orderLines.some((o) => o.ProductNo === no)) {
        const p = s.find((x) => x.ProductNo === no);
        if (p) p.Available = 0;
        save(data);
        return [{ Result: 'MarkedUnavailable' }];
      }
      data.stock = s.filter((x) => x.ProductNo !== no);
      save(data);
      return [{ Result: 'Deleted' }];
    }
    default:
      throw new Error('Unknown stored procedure ' + storedProcedure);
  }
}

module.exports = { call };
