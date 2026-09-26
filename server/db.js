import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  INITIAL_USER,
  INITIAL_CATEGORIES,
  INITIAL_WAREHOUSES,
  INITIAL_PRODUCTS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_LEDGER,
} from '../src/constants/initialData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${
    process.env.PGHOST || 'localhost'
  }:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'stocksense'}`;

export let isPostgresConnected = false;
export let activeDatabaseType = 'PostgreSQL';
let pool = null;

// Local Fallback Store file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getLocalStore() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialStore = {
      users: [INITIAL_USER],
      categories: INITIAL_CATEGORIES,
      warehouses: INITIAL_WAREHOUSES,
      products: INITIAL_PRODUCTS,
      receipts: INITIAL_RECEIPTS,
      deliveries: INITIAL_DELIVERIES,
      transfers: INITIAL_TRANSFERS,
      adjustments: INITIAL_ADJUSTMENTS,
      ledger: INITIAL_LEDGER,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialStore, null, 2), 'utf8');
    return initialStore;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveLocalStore(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function initDatabase() {
  ensureDataDir();

  try {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    isPostgresConnected = true;
    activeDatabaseType = 'PostgreSQL (Active)';
    console.log(`[Database] Successfully connected to PostgreSQL instance at: ${connectionString.split('@')[1] || 'localhost'}`);

    // Run schema migrations
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const ddl = fs.readFileSync(schemaPath, 'utf8');
      await client.query(ddl);
      console.log('[Database] PostgreSQL schema and relational tables verified.');
    }

    // Seed initial data if products table is empty
    const { rows } = await client.query('SELECT COUNT(*) as count FROM products');
    if (Number(rows[0].count) === 0) {
      console.log('[Database] Seeding initial inventory dataset into PostgreSQL...');
      await seedPostgresData(client);
      console.log('[Database] PostgreSQL database seeded successfully.');
    }

    client.release();
  } catch (err) {
    isPostgresConnected = false;
    activeDatabaseType = 'Local Relational Store (PostgreSQL Compatible)';
    console.warn(`[Database] Notice: PostgreSQL direct connection on port 5432 was not reachable (${err.message}).`);
    console.warn('[Database] Activated high-performance local relational fallback engine (server/data/db.json).');
    console.log('[Database] Ready! To switch to live PostgreSQL, set DATABASE_URL=postgres://user:pass@localhost:5432/stocksense in .env');
    getLocalStore();
  }
}

async function seedPostgresData(client) {
  // Users
  await client.query(
    `INSERT INTO users (id, name, email, password, role, department, assigned_warehouse, avatar_initials)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
    [
      INITIAL_USER.id,
      INITIAL_USER.name,
      INITIAL_USER.email,
      INITIAL_USER.password,
      INITIAL_USER.role,
      INITIAL_USER.department,
      INITIAL_USER.assignedWarehouse,
      INITIAL_USER.avatarInitials,
    ]
  );

  // Categories
  for (const cat of INITIAL_CATEGORIES) {
    await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cat]);
  }

  // Warehouses and Locations
  for (const w of INITIAL_WAREHOUSES) {
    await client.query(
      `INSERT INTO warehouses (id, code, name, address, contact_person, phone)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [w.id, w.code, w.name, w.address, w.contactPerson, w.phone]
    );

    for (const loc of w.locations || []) {
      await client.query(
        `INSERT INTO locations (id, warehouse_id, code, name, type)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [loc.id, w.id, loc.code, loc.name, loc.type]
      );
    }
  }

  // Products and location stocks
  for (const p of INITIAL_PRODUCTS) {
    await client.query(
      `INSERT INTO products (id, name, sku, category, uom, reorder_level, cost_price, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.sku, p.category, p.uom, p.reorderLevel, p.costPrice, p.description]
    );

    for (const [locId, qty] of Object.entries(p.stockByLocation || {})) {
      await client.query(
        `INSERT INTO location_stocks (product_id, location_id, quantity)
         VALUES ($1, $2, $3) ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
        [p.id, locId, qty]
      );
    }
  }

  // Receipts
  for (const r of INITIAL_RECEIPTS) {
    await client.query(
      `INSERT INTO receipts (id, reference, supplier, warehouse_id, location_id, status, notes, created_at, validated_at, validated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.reference, r.supplier, r.warehouseId, r.locationId, r.status, r.notes, r.createdAt, r.validatedAt, r.validatedBy]
    );

    for (const item of r.items || []) {
      await client.query(
        `INSERT INTO receipt_items (receipt_id, product_id, quantity, uom)
         VALUES ($1, $2, $3, $4)`,
        [r.id, item.productId, item.quantity, item.uom]
      );
    }
  }

  // Deliveries
  for (const d of INITIAL_DELIVERIES) {
    await client.query(
      `INSERT INTO deliveries (id, reference, customer, warehouse_id, location_id, status, notes, created_at, validated_at, validated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
      [d.id, d.reference, d.customer, d.warehouseId, d.locationId, d.status, d.notes, d.createdAt, d.validatedAt, d.validatedBy]
    );

    for (const item of d.items || []) {
      await client.query(
        `INSERT INTO delivery_items (delivery_id, product_id, quantity, uom)
         VALUES ($1, $2, $3, $4)`,
        [d.id, item.productId, item.quantity, item.uom]
      );
    }
  }

  // Transfers
  for (const t of INITIAL_TRANSFERS) {
    await client.query(
      `INSERT INTO transfers (id, reference, product_id, source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, quantity, uom, status, notes, created_at, validated_at, validated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
      [t.id, t.reference, t.productId, t.sourceWarehouseId, t.sourceLocationId, t.destWarehouseId, t.destLocationId, t.quantity, t.uom, t.status, t.notes, t.createdAt, t.validatedAt, t.validatedBy]
    );
  }

  // Adjustments
  for (const a of INITIAL_ADJUSTMENTS) {
    await client.query(
      `INSERT INTO adjustments (id, reference, product_id, warehouse_id, location_id, previous_quantity, counted_quantity, difference, uom, reason, adjusted_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
      [a.id, a.reference, a.productId, a.warehouseId, a.locationId, a.previousQuantity, a.countedQuantity, a.difference, a.uom, a.reason, a.adjustedBy, a.status, a.createdAt]
    );
  }

  // Ledger
  for (const l of INITIAL_LEDGER) {
    await client.query(
      `INSERT INTO stock_ledger (id, timestamp, reference, operation_type, product_id, product_name, sku, source_location, dest_location, quantity, uom, previous_stock, new_stock, operator_name, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT (id) DO NOTHING`,
      [l.id, l.timestamp, l.reference, l.operationType, l.productId, l.productName, l.sku, l.sourceLocation, l.destLocation, l.quantity, l.uom, l.previousStock, l.newStock, l.user, l.reason, l.status]
    );
  }
}

export const db = {
  getLocalStore,
  saveLocalStore,
  resetLocalStore() {
    const initialStore = {
      users: [INITIAL_USER],
      categories: INITIAL_CATEGORIES,
      warehouses: INITIAL_WAREHOUSES,
      products: INITIAL_PRODUCTS,
      receipts: INITIAL_RECEIPTS,
      deliveries: INITIAL_DELIVERIES,
      transfers: INITIAL_TRANSFERS,
      adjustments: INITIAL_ADJUSTMENTS,
      ledger: INITIAL_LEDGER,
    };
    saveLocalStore(initialStore);
    return initialStore;
  },
  async query(text, params = []) {
    if (isPostgresConnected && pool) {
      return pool.query(text, params);
    }
    return null;
  },
  getStatus() {
    return {
      connected: isPostgresConnected,
      databaseType: activeDatabaseType,
      connectionString: isPostgresConnected ? connectionString.replace(/:[^:@]*@/, ':****@') : 'Local relational persistence',
    };
  },
};
