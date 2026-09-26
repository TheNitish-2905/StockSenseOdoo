-- StockSense PostgreSQL Relational Database Schema
-- Standard SQL compatible with PostgreSQL 12+

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Inventory Specialist',
  department VARCHAR(100) DEFAULT 'Warehouse Operations',
  assigned_warehouse VARCHAR(64) DEFAULT 'WH-01',
  avatar_initials VARCHAR(8) DEFAULT 'AD',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) DEFAULT 'Standard Storage',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  uom VARCHAR(32) NOT NULL DEFAULT 'units',
  reorder_level NUMERIC NOT NULL DEFAULT 10,
  cost_price NUMERIC(12, 2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS location_stocks (
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, location_id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(64) UNIQUE NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMPTZ,
  validated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id SERIAL PRIMARY KEY,
  receipt_id VARCHAR(64) NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  uom VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(64) UNIQUE NOT NULL,
  customer VARCHAR(255) NOT NULL,
  warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  status VARCHAR(32) NOT NULL DEFAULT 'Ready',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMPTZ,
  validated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS delivery_items (
  id SERIAL PRIMARY KEY,
  delivery_id VARCHAR(64) NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  uom VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(64) UNIQUE NOT NULL,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  source_warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
  source_location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  dest_warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
  dest_location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  quantity NUMERIC NOT NULL,
  uom VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'Waiting',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMPTZ,
  validated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS adjustments (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(64) UNIQUE NOT NULL,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  previous_quantity NUMERIC NOT NULL,
  counted_quantity NUMERIC NOT NULL,
  difference NUMERIC NOT NULL,
  uom VARCHAR(32),
  reason TEXT,
  adjusted_by VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'Done',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reference VARCHAR(64) NOT NULL,
  operation_type VARCHAR(32) NOT NULL,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  source_location VARCHAR(255) NOT NULL,
  dest_location VARCHAR(255) NOT NULL,
  quantity NUMERIC NOT NULL,
  uom VARCHAR(32),
  previous_stock NUMERIC,
  new_stock NUMERIC,
  operator_name VARCHAR(255),
  reason TEXT,
  status VARCHAR(32) DEFAULT 'Done'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_location_stocks_prod ON location_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_prod ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_timestamp ON stock_ledger(timestamp DESC);
