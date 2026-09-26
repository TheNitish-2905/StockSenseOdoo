import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initDatabase, isPostgresConnected } from './db.js';
import {
  calculateTotalStock,
  getStockAtLocation,
  findLocationName,
  inventoryService,
} from '../src/services/inventoryService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize database
await initDatabase();

// Health & Database Connection Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...db.getStatus(),
  });
});

// AUTHENTICATION ROUTES
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const store = db.getLocalStore();
  const user = store.users?.find(
    (u) => u.email.toLowerCase() === (email || '').trim().toLowerCase() && u.password === password
  );

  if (user || (email === 'admin@stocksense.local' && password === 'admin123')) {
    const matched = user || store.users[0];
    return res.json({ success: true, user: matched });
  }

  res.status(401).json({ error: 'Invalid email or password.' });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  const store = db.getLocalStore();
  const existing = store.users?.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with that email already exists.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'Inventory Specialist',
    department: 'Warehouse Operations',
    assignedWarehouse: 'WH-01',
    avatarInitials: name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US',
  };

  store.users = [...(store.users || []), newUser];
  db.saveLocalStore(store);

  res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/otp', (req, res) => {
  const { email } = req.body;
  const store = db.getLocalStore();
  const user = store.users?.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

  if (!user && email !== 'admin@stocksense.local') {
    return res.status(404).json({ error: 'No registered account found with that email.' });
  }

  res.json({ success: true, otp: '849201' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (otp !== '849201' && otp !== '123456') {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const store = db.getLocalStore();
  store.users = store.users?.map((u) =>
    u.email.toLowerCase() === (email || '').trim().toLowerCase() ? { ...u, password: newPassword } : u
  );
  db.saveLocalStore(store);

  res.json({ success: true, message: 'Password reset successfully.' });
});

// PRODUCTS ROUTES
app.get('/api/products', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.products || []);
});

app.post('/api/products', (req, res) => {
  const productData = req.body;
  const store = db.getLocalStore();

  const duplicate = store.products?.find(
    (p) => p.sku.trim().toLowerCase() === productData.sku?.trim().toLowerCase()
  );
  if (duplicate) {
    return res.status(400).json({ error: `A product with SKU "${productData.sku}" already exists.` });
  }

  const newProduct = {
    id: `PRD-${Date.now().toString().slice(-4)}`,
    name: productData.name.trim(),
    sku: productData.sku.trim().toUpperCase(),
    category: productData.category,
    uom: productData.uom || 'units',
    reorderLevel: Number(productData.reorderLevel) || 10,
    costPrice: Number(productData.costPrice) || 0,
    description: productData.description || '',
    stockByLocation: productData.initialLocationId
      ? { [productData.initialLocationId]: Number(productData.initialStock) || 0 }
      : {},
  };

  store.products = [newProduct, ...(store.products || [])];

  const initialQty = Number(productData.initialStock) || 0;
  if (initialQty > 0 && productData.initialLocationId) {
    const entry = {
      id: `LED-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reference: 'INIT-STOCK',
      operationType: 'Receipt',
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      sourceLocation: 'Opening Balance Setup',
      destLocation: productData.initialLocationName || 'Warehouse Storage',
      quantity: initialQty,
      uom: newProduct.uom,
      previousStock: 0,
      newStock: initialQty,
      user: 'Administrator',
      reason: 'Initial Product Stock Registration',
      status: 'Done',
    };
    store.ledger = [entry, ...(store.ledger || [])];
  }

  db.saveLocalStore(store);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const store = db.getLocalStore();

  const duplicate = store.products?.find(
    (p) => p.id !== id && p.sku.trim().toLowerCase() === updatedData.sku?.trim().toLowerCase()
  );
  if (duplicate) {
    return res.status(400).json({ error: `Another product with SKU "${updatedData.sku}" already exists.` });
  }

  store.products = store.products?.map((p) => (p.id === id ? { ...p, ...updatedData } : p));
  db.saveLocalStore(store);
  res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const store = db.getLocalStore();
  const prod = store.products?.find((p) => p.id === id);

  if (prod) {
    const stock = calculateTotalStock(prod);
    if (stock > 0) {
      return res.status(400).json({
        error: `Cannot delete product with active stock (${stock} ${prod.uom}). Please adjust stock to 0 first.`,
      });
    }
  }

  store.products = store.products?.filter((p) => p.id !== id);
  db.saveLocalStore(store);
  res.json({ success: true });
});

// CATEGORIES ROUTES
app.get('/api/categories', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.categories || []);
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

  const store = db.getLocalStore();
  const trimmed = name.trim();
  if (store.categories?.includes(trimmed)) {
    return res.status(400).json({ error: `Category "${trimmed}" already exists.` });
  }

  store.categories = [...(store.categories || []), trimmed];
  db.saveLocalStore(store);
  res.status(201).json(store.categories);
});

// WAREHOUSES & LOCATIONS ROUTES
app.get('/api/warehouses', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.warehouses || []);
});

app.post('/api/warehouses', (req, res) => {
  const whData = req.body;
  const store = db.getLocalStore();

  const newWh = {
    id: `WH-${String((store.warehouses || []).length + 1).padStart(2, '0')}`,
    code: whData.code.trim().toUpperCase(),
    name: whData.name.trim(),
    address: whData.address || '',
    contactPerson: whData.contactPerson || '',
    phone: whData.phone || '',
    locations: [],
  };

  store.warehouses = [...(store.warehouses || []), newWh];
  db.saveLocalStore(store);
  res.status(201).json(newWh);
});

app.post('/api/warehouses/:id/locations', (req, res) => {
  const { id } = req.params;
  const locData = req.body;
  const store = db.getLocalStore();

  const newLoc = {
    id: `LOC-${id.replace('WH-', '')}-${Date.now().toString().slice(-4)}`,
    code: locData.code.trim().toUpperCase(),
    name: locData.name.trim(),
    type: locData.type || 'Standard Storage',
  };

  store.warehouses = store.warehouses?.map((w) =>
    w.id === id ? { ...w, locations: [...(w.locations || []), newLoc] } : w
  );
  db.saveLocalStore(store);
  res.status(201).json(newLoc);
});

// RECEIPTS ROUTES
app.get('/api/receipts', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.receipts || []);
});

app.post('/api/receipts', (req, res) => {
  const data = req.body;
  const store = db.getLocalStore();

  const ref = `REC-${new Date().getFullYear()}-${String((store.receipts || []).length + 1).padStart(3, '0')}`;
  const newReceipt = {
    id: ref,
    reference: ref,
    supplier: data.supplier,
    warehouseId: data.warehouseId,
    locationId: data.locationId,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    validatedAt: null,
    validatedBy: null,
    notes: data.notes || '',
    items: data.items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      uom: it.uom,
    })),
  };

  store.receipts = [newReceipt, ...(store.receipts || [])];
  db.saveLocalStore(store);
  res.status(201).json(newReceipt);
});

app.post('/api/receipts/:id/validate', (req, res) => {
  const { id } = req.params;
  const user = req.body.user || { name: 'Authorized Staff' };
  const store = db.getLocalStore();

  try {
    const result = inventoryService.validateReceipt(
      {
        products: store.products,
        receipts: store.receipts,
        ledger: store.ledger,
        warehouses: store.warehouses,
      },
      id,
      user
    );

    store.products = result.updatedProducts;
    store.receipts = result.updatedReceipts;
    store.ledger = result.updatedLedger;
    db.saveLocalStore(store);

    res.json({ success: true, message: 'Receipt validated and stock added' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELIVERIES ROUTES
app.get('/api/deliveries', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.deliveries || []);
});

app.post('/api/deliveries', (req, res) => {
  const data = req.body;
  const store = db.getLocalStore();

  const ref = `DEL-${new Date().getFullYear()}-${String((store.deliveries || []).length + 1).padStart(3, '0')}`;
  const newDelivery = {
    id: ref,
    reference: ref,
    customer: data.customer,
    warehouseId: data.warehouseId,
    locationId: data.locationId,
    status: data.status || 'Ready',
    createdAt: new Date().toISOString(),
    validatedAt: null,
    validatedBy: null,
    notes: data.notes || '',
    items: data.items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      uom: it.uom,
    })),
  };

  store.deliveries = [newDelivery, ...(store.deliveries || [])];
  db.saveLocalStore(store);
  res.status(201).json(newDelivery);
});

app.post('/api/deliveries/:id/validate', (req, res) => {
  const { id } = req.params;
  const user = req.body.user || { name: 'Authorized Staff' };
  const store = db.getLocalStore();

  try {
    const result = inventoryService.validateDelivery(
      {
        products: store.products,
        deliveries: store.deliveries,
        ledger: store.ledger,
        warehouses: store.warehouses,
      },
      id,
      user
    );

    store.products = result.updatedProducts;
    store.deliveries = result.updatedDeliveries;
    store.ledger = result.updatedLedger;
    db.saveLocalStore(store);

    res.json({ success: true, message: 'Delivery fulfilled and stock deducted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// TRANSFERS ROUTES
app.get('/api/transfers', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.transfers || []);
});

app.post('/api/transfers', (req, res) => {
  const data = req.body;
  const store = db.getLocalStore();

  const ref = `TRF-${new Date().getFullYear()}-${String((store.transfers || []).length + 1).padStart(3, '0')}`;
  const newTransfer = {
    id: ref,
    reference: ref,
    sourceWarehouseId: data.sourceWarehouseId,
    sourceLocationId: data.sourceLocationId,
    destWarehouseId: data.destWarehouseId,
    destLocationId: data.destLocationId,
    productId: data.productId,
    quantity: Number(data.quantity),
    uom: data.uom,
    status: 'Waiting',
    createdAt: new Date().toISOString(),
    validatedAt: null,
    validatedBy: null,
    notes: data.notes || '',
  };

  store.transfers = [newTransfer, ...(store.transfers || [])];
  db.saveLocalStore(store);
  res.status(201).json(newTransfer);
});

app.post('/api/transfers/:id/validate', (req, res) => {
  const { id } = req.params;
  const user = req.body.user || { name: 'Authorized Staff' };
  const store = db.getLocalStore();

  try {
    const result = inventoryService.validateTransfer(
      {
        products: store.products,
        transfers: store.transfers,
        ledger: store.ledger,
        warehouses: store.warehouses,
      },
      id,
      user
    );

    store.products = result.updatedProducts;
    store.transfers = result.updatedTransfers;
    store.ledger = result.updatedLedger;
    db.saveLocalStore(store);

    res.json({ success: true, message: 'Transfer completed and stock relocated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADJUSTMENTS ROUTES
app.get('/api/adjustments', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.adjustments || []);
});

app.post('/api/adjustments', (req, res) => {
  const data = req.body;
  const user = req.body.user || { name: 'Authorized Staff' };
  const store = db.getLocalStore();

  try {
    const result = inventoryService.performAdjustment(
      {
        products: store.products,
        adjustments: store.adjustments,
        ledger: store.ledger,
        warehouses: store.warehouses,
      },
      data,
      user
    );

    store.products = result.updatedProducts;
    store.adjustments = result.updatedAdjustments;
    store.ledger = result.updatedLedger;
    db.saveLocalStore(store);

    res.json({ success: true, message: 'Adjustment recorded and stock updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// STOCK LEDGER ROUTE
app.get('/api/ledger', (req, res) => {
  const store = db.getLocalStore();
  res.json(store.ledger || []);
});

// RESET TO DEMO DATA
app.post('/api/reset-demo-data', (req, res) => {
  const resetStore = db.resetLocalStore();
  res.json({ success: true, data: resetStore });
});

app.listen(PORT, () => {
  console.log(`[StockSense Server] API Server running on port ${PORT}`);
  console.log(`[StockSense Server] Health check: http://localhost:${PORT}/api/health`);
});
