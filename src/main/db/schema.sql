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
    sale_date DATE NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'credit')) NOT NULL,
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
