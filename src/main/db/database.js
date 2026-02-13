import path from "path";
import { app } from "electron";
import { createRequire } from "module";

// Import sqlite3 using CommonJS require (it's a native CommonJS module)
const require = createRequire(import.meta.url);
const sqlite3 = require("sqlite3");

const dbPath = path.join(app.getPath("userData"), "poultry.db");

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

// Wrapper to promisify sqlite3 operations
class Database {
  constructor(filePath) {
    this.db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      }
    });
    this.db.configure('busyTimeout', 5000);
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  pragma(pragma) {
    return this.run(`PRAGMA ${pragma}`);
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async initialize() {
    // Enable FK constraints
    await this.pragma('foreign_keys = ON');
    
    // Initialize database schema
    await this.exec(SCHEMA);

    // Migration: Add missing columns to sales table for debt/change tracking
    try {
      const tableInfo = await this.all(`PRAGMA table_info(sales)`);
      const columns = tableInfo.map(col => col.name);

      // Add missing columns if they don't exist
      if (!columns.includes('customer_name')) {
        await this.run(`ALTER TABLE sales ADD COLUMN customer_name TEXT`);
        console.log('✓ Added customer_name column');
      }
      if (!columns.includes('customer_phone')) {
        await this.run(`ALTER TABLE sales ADD COLUMN customer_phone TEXT`);
        console.log('✓ Added customer_phone column');
      }
      if (!columns.includes('amount_paid')) {
        await this.run(`ALTER TABLE sales ADD COLUMN amount_paid REAL DEFAULT 0`);
        console.log('✓ Added amount_paid column');
      }
      if (!columns.includes('change_amount')) {
        await this.run(`ALTER TABLE sales ADD COLUMN change_amount REAL DEFAULT 0`);
        console.log('✓ Added change_amount column');
      }
      if (!columns.includes('debt_amount')) {
        await this.run(`ALTER TABLE sales ADD COLUMN debt_amount REAL DEFAULT 0`);
        console.log('✓ Added debt_amount column');
      }
      if (!columns.includes('status')) {
        await this.run(`ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'`);
        console.log('✓ Added status column');
      }
    } catch (error) {
      console.error('Migration error (non-critical):', error.message);
    }
  }
}

const db = new Database(dbPath);

export default db;

