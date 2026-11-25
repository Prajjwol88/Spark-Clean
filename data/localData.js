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

// Staff Management: same test staff as database/05_staff_management.sql (added the first time they are needed)
const testStaff = [
  ['Alex Jensen', 'alex@example.com', '12345678', 'Cleaner', '2026-02-10', 145, 0, 1],
  ['Sam Taylor', 'sam@example.com', '22334455', 'Team Manager', '2025-11-03', 190, 1, 1],
  ['Jamie Lee', 'jamie@example.com', '33445566', 'Supervisor', '2025-08-18', 170, 0, 0],
  ['Freja Hansen', 'freja@example.com', '44556677', 'Cleaner', '2026-05-04', 145, 0, 1],
  ['Mikkel Larsen', 'mikkel@example.com', '', 'Window Cleaner', '2026-07-21', 155.5, 0, 1]
].map((s, i) => ({
  StaffNo: 1001 + i, FullName: s[0], Email: s[1], Phone: s[2], JobRole: s[3],
  StartDate: s[4], HourlyRate: s[5], IsManager: s[6], Active: s[7]
}));
function staffOf(data) {
  if (!data.staff) { data.staff = testStaff.map((s) => ({ ...s })); data.nextStaffNo = 1006; }
  return data.staff;
}
// Staff login: every test staff member starts with the demo password Staff2026! (same as 06_staff_login.sql)
const demoHash = '5f75a21591cf23ce68b4ccfba5caf0ef:81cff491ec9ba7994b665ef06c0c0f2f5706c883d793aabb496296cf2fb378c38e28767a2b8a5933fa793f106d01b0878f428629a62c43e47a363ec4b7f48d57';
function accountsOf(data) {
  if (!data.staffAccounts) {
    data.staffAccounts = testStaff.map((s) => ({ StaffNo: s.StaffNo, PasswordHash: demoHash, LastLogin: null }));
  }
  // deleting a staff member also deletes their account (like ON DELETE CASCADE)
  data.staffAccounts = data.staffAccounts.filter((a) => staffOf(data).some((s) => s.StaffNo === a.StaffNo));
  return data.staffAccounts;
}
const byFullName = (a, b) => a.FullName.localeCompare(b.FullName);
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
    // ---------- Sprint 5 upgrades ----------
    case 'sproc_tblStock_UpdateHazard': {
      const p = s.find((x) => x.ProductNo === Number(params[0]));
      if (p) p.HazardWarning = params[1] || '';
      save(data);
      return [];
    }
    case 'sproc_tblStockLog_Insert': {
      data.log = data.log || [];
      data.nextLogNo = data.nextLogNo || 1;
      const [ProductNo, Action, ProductName, ChangedBy] = params;
      const LogNo = data.nextLogNo++;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      data.log.push({ LogNo, ProductNo: Number(ProductNo), Action, ProductName, ChangedBy, ChangedAt: now });
      save(data);
      return [{ LogNo }];
    }
    case 'sproc_tblStockLog_DeleteTestEntries':
      data.log = (data.log || []).filter((e) => e.ChangedBy !== 'Automated test');
      save(data);
      return [];
    case 'sproc_tblStockLog_SelectAll':
      return [...(data.log || [])].sort((a, b) => b.LogNo - a.LogNo);
    // ---------- Staff Management (same as database/05_staff_management.sql) ----------
    case 'sproc_tblStaff_SelectAll':
      return [...staffOf(data)].sort(byFullName);
    case 'sproc_tblStaff_FilterByStaffNo':
      return staffOf(data).filter((s) => s.StaffNo === Number(params[0]));
    case 'sproc_tblStaff_FilterByNameOrEmail': {
      const text = String(params[0] || '').toLowerCase();
      const status = params[1];
      return staffOf(data).filter((s) =>
        (s.FullName.toLowerCase().includes(text) || s.Email.toLowerCase().includes(text)) &&
        (status === 'all' || (status === 'active' && s.Active) || (status === 'inactive' && !s.Active))
      ).sort(byFullName);
    }
    case 'sproc_tblStaff_EmailInUse': {
      const email = String(params[0] || '').toLowerCase();
      const inUse = staffOf(data).some((s) => s.Email.toLowerCase() === email && s.StaffNo !== Number(params[1]));
      return [{ InUse: inUse ? 1 : 0 }];
    }
    case 'sproc_tblStaff_Insert': {
      const list = staffOf(data);
      const [FullName, Email, Phone, JobRole, StartDate, HourlyRate, IsManager] = params;
      if (list.some((s) => s.Email.toLowerCase() === String(Email).toLowerCase())) {
        const err = new Error('Duplicate email'); err.code = 'ER_DUP_ENTRY'; throw err;
      }
      const StaffNo = data.nextStaffNo++;
      list.push({ StaffNo, FullName, Email, Phone, JobRole, StartDate,
        HourlyRate: Number(HourlyRate), IsManager: IsManager ? 1 : 0, Active: 1 });
      save(data);
      return [{ StaffNo }];
    }
    case 'sproc_tblStaff_Update': {
      const [StaffNo, FullName, Email, Phone, JobRole, StartDate, HourlyRate, IsManager] = params;
      const s = staffOf(data).find((x) => x.StaffNo === Number(StaffNo));
      if (s) Object.assign(s, { FullName, Email, Phone, JobRole, StartDate,
        HourlyRate: Number(HourlyRate), IsManager: IsManager ? 1 : 0 });
      save(data);
      return [{ Found: s ? 1 : 0 }];
    }
    case 'sproc_tblStaff_SetActive': {
      const s = staffOf(data).find((x) => x.StaffNo === Number(params[0]));
      if (s) s.Active = params[1] ? 1 : 0;
      save(data);
      return [{ Found: s ? 1 : 0 }];
    }
    case 'sproc_tblStaff_Delete': {
      const no = Number(params[0]);
      const s = staffOf(data).find((x) => x.StaffNo === no);
      if (!s) return [{ Result: 'NotFound' }];
      if (s.Active) return [{ Result: 'StillActive' }];
      data.staff = data.staff.filter((x) => x.StaffNo !== no);
      save(data);
      return [{ Result: 'Deleted' }];
    }
    // ---------- Staff login (same as database/06_staff_login.sql) ----------
    case 'sproc_tblStaffAccount_FilterByEmail': {
      const email = String(params[0] || '').toLowerCase();
      const s = staffOf(data).find((x) => x.Email.toLowerCase() === email);
      const acc = s && accountsOf(data).find((a) => a.StaffNo === s.StaffNo);
      if (!s || !acc) return [];
      return [{ StaffNo: s.StaffNo, FullName: s.FullName, Email: s.Email, IsManager: s.IsManager,
        Active: s.Active, PasswordHash: acc.PasswordHash, LastLogin: acc.LastLogin || null }];
    }
    case 'sproc_tblStaffAccount_SetPassword': {
      const no = Number(params[0]);
      if (!staffOf(data).some((x) => x.StaffNo === no)) return [{ Found: 0 }];
      const list = accountsOf(data);
      const acc = list.find((a) => a.StaffNo === no);
      if (acc) acc.PasswordHash = params[1];
      else list.push({ StaffNo: no, PasswordHash: params[1], LastLogin: null });
      save(data);
      return [{ Found: 1 }];
    }
    case 'sproc_tblStaffAccount_RecordLogin': {
      const acc = accountsOf(data).find((a) => a.StaffNo === Number(params[0]));
      if (acc) { acc.LastLogin = new Date().toISOString(); save(data); }
      return [];
    }
    case 'sproc_tblStaff_UpdatePhone': {
      const s = staffOf(data).find((x) => x.StaffNo === Number(params[0]));
      if (s) { s.Phone = params[1]; save(data); }
      return [{ Found: s ? 1 : 0 }];
    }
    default:
      throw new Error('Unknown stored procedure ' + storedProcedure);
  }
}

module.exports = { call };
