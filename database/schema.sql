-- database/schema.sql

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Units Table
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
    -- abbreviation TEXT UNIQUE NOT NULL -- Removed as per PRD focus
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER, -- Self-referencing key for hierarchy
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE RESTRICT -- Prevent deleting a category if it has sub-categories
);

-- Index for Categories Table
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);

-- Items Table
-- Includes reference to units, current_quantity, status, and creation timestamp
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    -- description TEXT, -- Removed, not specified as core field in PRD item forms/views
    unit_id INTEGER NOT NULL,
    sub_category_id INTEGER, -- Foreign key to the new categories table
    provider_id INTEGER, -- Foreign key to the providers table
    current_quantity INTEGER NOT NULL DEFAULT 0, -- Changed to INTEGER as per PRD quantity handling
    cost REAL,     -- Added cost column (can be NULL)
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')), -- Standardized to lowercase and added discontinued
    barcode TEXT UNIQUE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT, -- Prevent deleting units if items reference them
    FOREIGN KEY (sub_category_id) REFERENCES categories(id) ON DELETE SET NULL, -- Prevent deleting category if items reference it
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- Indexes for Items Table
CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status); -- Changed from idx_items_is_active
CREATE INDEX IF NOT EXISTS idx_items_sub_category_id ON items (sub_category_id); -- Index for faster filtering by sub-category

-- Quantity Adjustments Table -- REMOVED as its functionality is covered by movement_logs and direct updates to items.current_quantity
-- CREATE TABLE IF NOT EXISTS quantity_adjustments (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     item_id INTEGER NOT NULL,
--     change_amount REAL NOT NULL, 
--     new_quantity REAL NOT NULL,  
--     provider TEXT,               
--     cost REAL,                   
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE 
-- );

-- Indexes for Quantity Adjustments Table -- REMOVED
-- CREATE INDEX IF NOT EXISTS idx_qty_adjust_item_id ON quantity_adjustments (item_id);
-- CREATE INDEX IF NOT EXISTS idx_qty_adjust_timestamp ON quantity_adjustments (timestamp);

-- Movement Logs Table
-- Records significant events related to items (creation, updates, status changes, adjustments)
CREATE TABLE IF NOT EXISTS movement_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    item_id INTEGER NOT NULL,
    item_name TEXT, -- Stored for historical reference (PRD FR3.1)
    action_type TEXT NOT NULL, -- e.g., 'Addition', 'Removal', 'Update', 'Activate', 'Deactivate'
    quantity_changed INTEGER,     -- Amount added/removed (NULL for non-quantity actions). Changed to INTEGER.
    resulting_quantity INTEGER,   -- Quantity AFTER the action (NULL for non-quantity actions). Changed to INTEGER.
    provider_id INTEGER,       -- Foreign key to the providers table
    cost_per_item REAL,        -- Cost per item for additions (NULL otherwise). Renamed from cost.
    details TEXT,              -- Optional: More details about the action (e.g., field updated)
    person_name TEXT,          -- Name of the person performing the action (optional)
    destination_id INTEGER,    -- Foreign key to the destinations table
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT, -- Changed from CASCADE to RESTRICT if item deletion is soft (deactivation)
                                                              -- If items are hard deleted, CASCADE is fine. PRD FR1.5 suggests deactivation.
                                                              -- Let's assume deactivation is the primary mode, so logs should remain.
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- Destinations Table
CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Indexes for Movement Logs Table
CREATE INDEX IF NOT EXISTS idx_mov_log_item_id ON movement_logs (item_id);
CREATE INDEX IF NOT EXISTS idx_mov_log_action_type ON movement_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_mov_log_timestamp ON movement_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_mov_log_provider_id ON movement_logs (provider_id);
CREATE INDEX IF NOT EXISTS idx_mov_log_destination_id ON movement_logs (destination_id); 

-- Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Index for Providers Table
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers (name); 