# SparkClean Ltd – Stock Management component (Bibek)

JavaScript (Node.js + Express) with HTML and CSS, MySQL stored procedures, using the three layer architecture.

| Layer | Files |
|---|---|
| Presentation | `public/*.html`, `public/css/style.css`, `public/js/*.js`, `server.js` |
| Middle (business) | `classes/clsStock.js`, `classes/clsStockCollection.js`, `classes/clsStaffLogin.js`, `classes/clsStockLog.js`, `classes/clsStaff.js`, `classes/clsStaffCollection.js` |
| Data | `data/clsDataConnection.js`, `database/01_tables.sql`, `02_test_data.sql`, `03_stored_procedures.sql`, `04_sprint5_upgrades.sql`, `05_staff_management.sql` |

## What you need
1. **Node.js** (LTS version) from nodejs.org
2. **MySQL 8** (MySQL Workbench is fine) or MariaDB
3. **VS Code**

## 1. Set up the database
In MySQL Workbench (or the `mysql` command line) run the three files **in order**:
1. `database/01_tables.sql`
2. `database/02_test_data.sql`
3. `database/03_stored_procedures.sql`
4. `database/04_sprint5_upgrades.sql` (Sprint 5 Stock upgrades: hazard warnings and change log - run once)
5. `database/05_staff_management.sql` (Staff Management: tblStaff, test staff and stored procedures - safe to run again)

(Or run `database/SETUP_ALL.sql` once, which does all of this, including the MySQL login.)

Then create a login for the app (or put your own MySQL login in `db.config.js`):
```sql
CREATE USER IF NOT EXISTS 'sparkclean'@'localhost' IDENTIFIED BY 'sparkclean';
GRANT ALL PRIVILEGES ON sparkclean.* TO 'sparkclean'@'localhost';
```

**No MySQL yet?** The app still runs: if it cannot connect to MySQL it prints a warning in the terminal and saves products in `data/stock.json` instead (a backup copy of what the stored procedures do). Set up MySQL to use the real database.

## 2. Run it in VS Code
1. File → Open Folder → choose this `sparkclean-stock` folder (the one with `package.json` in it).
2. Open the terminal (Terminal → New Terminal) and type `npm install` (first time only).
3. Type `npm start` (or press F5 and pick *Run SparkClean (Stock)*).
4. Go to **http://localhost:3000**

**Login (Stock Manager only):** username **bibek** with the password set by the owner. Only the owner of this component can log in; other team members (and the old shared `staff` login) are refused. The password is stored only as a salted hash in `app.config.js`. To change it: `npm run set-password -- YourNewPassword`. After 5 wrong attempts the login locks for 5 minutes, and you are logged out after 30 minutes.

Customer shop page (no login): **http://localhost:3000/shop.html**

## 3. Run the tests
In the terminal type `npm test`.
- `tests/tstStock.test.js` – properties and Valid boundary tests, incl. hazard warning (64 tests, no database needed)
- `tests/tstStaffLogin.test.js` – only the Stock Manager can log in; passwords are hashed (9 tests)
- `tests/tstStockCollection.test.js` – list, Find, Add, Update, Delete, filters, low stock report, hazard warnings, security tests (20 tests, needs the database)
- `tests/tstStockLog.test.js` – change log Valid, Add and LoadAll (15 tests, needs the database)
- `tests/tstStaff.test.js` – staff properties and Valid boundary tests for every field (74 tests, no database needed)
- `tests/tstStaffCollection.test.js` – staff list, Find, Add, Update, activate/deactivate, Delete rule, unique email, search/status filters, security tests (28 tests, needs the database)

## Features
- Add, Edit, Delete (a product that is on an order is marked **unavailable** instead of deleted)
- List, Find by product number, Filter by name or category, Low stock report (5 or fewer)
- Validation on every field (name, category, price, quantity, date)
- Owner-only login (hashed password, lock after 5 wrong attempts) and main menu; public shop page shows only available, in-stock products

### Stock - Sprint 5 upgrade features (Bibek)
- **Hazard warnings**: an optional warning (up to 100 characters) for hazardous products such as bleach, entered on the add/edit form and shown on the stock list and the customer shop page.
- **Change log**: every add, edit, delete and "marked unavailable" is recorded in `tblStockLog` with the product, who made the change and when. Main menu, Change Log (`stock-log.html`, staff only).
- For an existing database run `database/04_sprint5_upgrades.sql` once.

## Client Management

From the existing staff main menu, open **Client Management** to list clients, search by name or email, register new clients, edit their details, or change their active status. Client records are stored in MySQL.

For an existing SparkClean database, run `database/01_tables.sql` and `database/03_stored_procedures.sql` in MySQL Workbench using your setup account. These scripts create missing tables and refresh the procedures. Use `database/SETUP_ALL.sql` for a fresh setup.

If your app account is `sparkclean_vscode`, start the app from the VS Code PowerShell terminal with:

```powershell
$env:SPARKCLEAN_DB_USER = 'sparkclean_vscode'
$env:SPARKCLEAN_DB_PASSWORD = Read-Host 'MySQL password' -MaskInput
npm start
```

The app defaults to `127.0.0.1:3306` and the `sparkclean` database. For a different server, set `SPARKCLEAN_DB_HOST` or `SPARKCLEAN_DB_PORT` in the same terminal. A VS Code database extension has its own connection settings.

## Staff Management

From the staff main menu, open **Staff Management** (`staff.html`, staff only) to manage SparkClean's employees. Staff records are stored in MySQL in `tblStaff` (staff numbers start at 1001).

| Layer | Files |
|---|---|
| Presentation | `public/staff.html`, `public/js/staff.js`, `public/css/staff.css`, `/api/staff` routes in `server.js` |
| Middle (business) | `classes/clsStaff.js` (properties, `Find`, `Valid`), `classes/clsStaffCollection.js` (`LoadAll`, `FilterByNameOrEmail`, `EmailInUse`, `Add`, `Update`, `SetActive`, `Delete`) |
| Data | `tblStaff` and the `sproc_tblStaff_*` stored procedures in `database/05_staff_management.sql` (also added to `01`, `02`, `03` and `SETUP_ALL.sql`) |

### Features
- **List** every staff member, with totals for all, active and inactive staff
- **Find** one staff member by typing their staff number in the search box
- **Search** by name or email, and **filter** by status (all, active, inactive)
- **Add** and **Edit** staff: full name, email, phone, job role, start date, hourly rate (DKK) and manager yes/no. New staff are always active.
- **Deactivate / Activate**: staff who leave are deactivated, so their record is kept
- **Delete**: only an inactive staff member can be permanently deleted (business rule, enforced in `sproc_tblStaff_Delete`), so nobody is removed by mistake
- **Validation** on every field (`clsStaff.Valid`), with every problem listed at once:
  - full name 1–100 characters, job role 1–50 characters
  - email required, valid format, at most 150 characters, and **unique** (checked with `sproc_tblStaff_EmailInUse` and a `UNIQUE` constraint)
  - phone optional, at most 20 characters, digits, spaces and `+ - ( )` only
  - start date a real date, not in the future and not before 2000
  - hourly rate 0.01–999.99 with at most 2 decimal places
- **Security**: staff pages and `/api/staff` need the staff login; every query uses stored procedure parameters (no SQL injection); names are escaped before being shown (no script injection)

### Existing database
Run `database/05_staff_management.sql` once in MySQL Workbench. It creates `tblStaff` only if it is missing, adds the test staff only if they are missing, and refreshes the stored procedures. If MySQL cannot be reached, Staff Management uses the backup data file `data/stock.json` (with the same 5 test staff), like Stock Management, so the page still works for a demo.

`sparkclean_staff_management.html` in the project folder is the original browser-only prototype; the real page is `public/staff.html`.
