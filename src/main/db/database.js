import path from "path";
import fs from "fs";
import { app } from "electron";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Database file path
const dbPath = path.join(app.getPath("userData"), "poultry.db");

class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.db = null;
    this.initPromise = this._init();
  }

  async _init() {
    try {
      console.log('Initializing sql.js...');

      let initSqlJs;
      let wasmPath;

      if (app.isPackaged) {
        // In production, sql.js is copied to resources/sql.js
        const sqlJsModulePath = path.join(process.resourcesPath, 'sql.js');
        initSqlJs = require(sqlJsModulePath);
        wasmPath = path.join(sqlJsModulePath, 'dist', 'sql-wasm.wasm');
      } else {
        // In development, require normally from node_modules
        initSqlJs = require('sql.js');
        wasmPath = path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');
      }

      const SQL = await initSqlJs({
        locateFile: () => wasmPath
      });

      // Load existing database from disk if it exists
      if (fs.existsSync(this.filePath)) {
        console.log(`Loading database from ${this.filePath}`);
        const buffer = fs.readFileSync(this.filePath);
        this.db = new SQL.Database(buffer);
      } else {
        console.log('Creating new in-memory database');
        this.db = new SQL.Database();
        // Save strictly to create the file immediately? Maybe not needed until first write.
      }

      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Failed to initialize database:', err);
      throw err;
    }
  }

  // Save the database to disk
  _save() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.filePath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  // Backup the database to a specific path
  async backup(destinationPath) {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(destinationPath, buffer);
      return true;
    } catch (err) {
      console.error('Backup failed:', err);
      throw err;
    }
  }

  async run(sql, params = []) {
    await this.initPromise;
    try {
      // sql.js .run() returns nothing, but we need to track changes/lastID for compatibility.
      // However, sql.js doesn't easily expose lastID/changes on run().
      // workaround: use exec for run? No.
      // For lastID, we can run 'SELECT last_insert_rowid()' immediately after?
      // sql.js documentation says db.run(sql, params) modifies the db.

      this.db.run(sql, params);

      // Attempt to get lastID if it was an INSERT
      let lastID = 0;
      let changes = 0; // sql.js doesn't give changes count easily without extra query

      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const res = this.db.exec('SELECT last_insert_rowid()');
        if (res && res.length && res[0].values && res[0].values.length) {
          lastID = res[0].values[0][0];
        }
      }

      // Save after every write operation
      this._save();

      return { lastID, changes };
    } catch (err) {
      console.error('Database run error:', err);
      throw err;
    }
  }

  async get(sql, params = []) {
    await this.initPromise;
    try {
      // sql.js doesn't have .get(), only .exec() which returns all results.
      // We mimic .get() by taking the first result.
      const stmt = this.db.prepare(sql, params);
      let row = undefined;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    } catch (err) {
      console.error('Database get error:', err);
      throw err;
    }
  }

  async all(sql, params = []) {
    await this.initPromise;
    try {
      const stmt = this.db.prepare(sql, params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Database all error:', err, sql);
      throw err;
    }
  }

  async exec(sql) {
    await this.initPromise;
    try {
      this.db.exec(sql);
      this._save(); // Save after exec (migration/schema changes)
    } catch (err) {
      console.error('Database exec error:', err);
      throw err;
    }
  }

  // Helper for pragma
  async pragma(statement) {
    // Pragma often doesn't need to return result like `run` does for ID, but `run` is fine.
    return this.run(`PRAGMA ${statement}`);
  }

  async initialize() {
    await this.initPromise;

    // Schema definition
    const SCHEMA = `
--The project consists of eleven tables: chicken-batch,eggs-batch,suppliers,inventory,eggs-graded,broiler-mortality,feed-consumption,broiler-consumption,broiler-consumption,egg-loss,sale,sales-item--

-- Suppliers (egg suppliers, bird suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    product TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Broiler batches
CREATE TABLE IF NOT EXISTS bird_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    batch_code TEXT UNIQUE,
    quantity_received INTEGER NOT NULL,
    cost_per_bird REAL NOT NULL,
    date_received DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    
);

-- Mortality & home consumption (recorded over time)
CREATE TABLE IF NOT EXISTS bird_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    event_type TEXT CHECK(event_type IN ('mortality', 'home_use')) NOT NULL,
    quantity INTEGER NOT NULL,
    event_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (batch_id) REFERENCES bird_batches(id)
);

-- Egg purchases (by crates)
CREATE TABLE IF NOT EXISTS egg_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    crates_received INTEGER NOT NULL,
    cost_per_crate REAL NOT NULL,
    date_received DATE NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Egg grading (sizes + quantities)
CREATE TABLE IF NOT EXISTS egg_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    egg_batch_id INTEGER NOT NULL,
    size TEXT CHECK(size IN ('small', 'medium', 'large')) NOT NULL,
    quantity INTEGER NOT NULL,
    selling_price REAL NOT NULL,
    FOREIGN KEY (egg_batch_id) REFERENCES egg_batches(id)
);

-- Inventory (feed, medicine, other supplies)
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit REAL NOT NULL,
    date_added DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);


--Feed consumption (recorded daily/weekly)
CREATE TABLE IF NOT EXISTS feed_consumption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    inventory_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    consumption_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (batch_id) REFERENCES bird_batches(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);


-- Eggs loss
CREATE TABLE IF NOT EXISTS egg_loss (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    egg_batch_id INTEGER NOT NULL,
    quantity_lost INTEGER NOT NULL,
    loss_date DATE NOT NULL,
    reason TEXT,
    FOREIGN KEY (egg_batch_id) REFERENCES egg_batches(id)
);

-- Sales (broilers and eggs)
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    sale_date DATE NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'credit')) NOT NULL,
    amount_paid REAL DEFAULT 0,
    change_amount REAL DEFAULT 0,
    debt_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sales items (broilers and eggs)
CREATE TABLE IF NOT EXISTS sales_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    item_type TEXT CHECK(item_type IN ('broiler', 'egg')) NOT NULL,
    reference_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Debt Payment History (track partial payments)
CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'mobile_money', 'bank_transfer')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Change Return History (track returns)
CREATE TABLE IF NOT EXISTS return_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    change_amount REAL NOT NULL,
    return_date DATE NOT NULL,
    returned_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);
`;

    // Enable FK constraints
    await this.run('PRAGMA foreign_keys = ON');

    // Initialize database schema
    await this.exec(SCHEMA);

    // Migration logic
    try {
      const tableInfo = await this.all(`PRAGMA table_info(sales)`);
      const columns = tableInfo.map(col => col.name);

      if (!columns.includes('customer_name')) {
        await this.run(`ALTER TABLE sales ADD COLUMN customer_name TEXT`);
      }
      if (!columns.includes('customer_phone')) {
        await this.run(`ALTER TABLE sales ADD COLUMN customer_phone TEXT`);
      }
      if (!columns.includes('amount_paid')) {
        await this.run(`ALTER TABLE sales ADD COLUMN amount_paid REAL DEFAULT 0`);
      }
      if (!columns.includes('change_amount')) {
        await this.run(`ALTER TABLE sales ADD COLUMN change_amount REAL DEFAULT 0`);
      }
      if (!columns.includes('debt_amount')) {
        await this.run(`ALTER TABLE sales ADD COLUMN debt_amount REAL DEFAULT 0`);
      }
      if (!columns.includes('status')) {
        await this.run(`ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'`);
      }
    } catch (error) {
      console.error('Migration error:', error.message);
    }

    // Check if we need to seed initial data? (Skipped for now)
  }
}

const db = new Database(dbPath);

export default db;
