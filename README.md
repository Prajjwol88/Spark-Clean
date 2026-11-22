# SparkClean Ltd – Stock Management component (Bibek)

JavaScript (Node.js + Express) with HTML and CSS, MySQL stored procedures, using the three layer architecture.

| Layer | Files |
|---|---|
| Presentation | `public/*.html`, `public/css/style.css`, `public/js/*.js`, `server.js` |
| Middle (business) | `classes/clsStock.js`, `classes/clsStockCollection.js` |
| Data | `data/clsDataConnection.js`, `database/01_tables.sql`, `02_test_data.sql`, `03_stored_procedures.sql` |

## What you need
1. **Node.js** (LTS version) from nodejs.org
2. **MySQL 8** (MySQL Workbench is fine) or MariaDB
3. **VS Code**

## 1. Set up the database
In MySQL Workbench (or the `mysql` command line) run the three files **in order**:
1. `database/01_tables.sql`
2. `database/02_test_data.sql`
3. `database/03_stored_procedures.sql`

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
- `tests/tstStock.test.js` – properties and Valid boundary tests (54 tests, no database needed)
- `tests/tstStaffLogin.test.js` – only the Stock Manager can log in; passwords are hashed (9 tests)
- `tests/tstStockCollection.test.js` – list, Find, Add, Update, Delete, filters, low stock report (15 tests, needs the database)

## Features
- Add, Edit, Delete (a product that is on an order is marked **unavailable** instead of deleted)
- List, Find by product number, Filter by name or category, Low stock report (5 or fewer)
- Validation on every field (name, category, price, quantity, date)
- Owner-only login (hashed password, lock after 5 wrong attempts) and main menu; public shop page shows only available, in-stock products

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

