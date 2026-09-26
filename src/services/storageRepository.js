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
} from '../constants/initialData.js';

const STORAGE_KEYS = {
  USER: 'stocksense_user',
  CATEGORIES: 'stocksense_categories',
  WAREHOUSES: 'stocksense_warehouses',
  PRODUCTS: 'stocksense_products',
  RECEIPTS: 'stocksense_receipts',
  DELIVERIES: 'stocksense_deliveries',
  TRANSFERS: 'stocksense_transfers',
  ADJUSTMENTS: 'stocksense_adjustments',
  LEDGER: 'stocksense_ledger',
  VERSION: 'stocksense_db_v2',
};

function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (e) {
    console.warn(`Failed to read from localStorage [${key}]`, e);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write to localStorage [${key}]`, e);
  }
}

export const storageRepository = {
  initialize() {
    // If version changed or empty, initialize default data
    const currentVersion = safeGet(STORAGE_KEYS.VERSION, null);
    if (currentVersion !== 'v2.0') {
      this.resetToDefaults();
    }
  },

  resetToDefaults() {
    safeSet(STORAGE_KEYS.VERSION, 'v2.0');
    safeSet(STORAGE_KEYS.USER, INITIAL_USER);
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSet(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
    safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    safeSet(STORAGE_KEYS.RECEIPTS, INITIAL_RECEIPTS);
    safeSet(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    safeSet(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFERS);
    safeSet(STORAGE_KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    safeSet(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
  },

  getUser() {
    return safeGet(STORAGE_KEYS.USER, INITIAL_USER);
  },
  saveUser(user) {
    safeSet(STORAGE_KEYS.USER, user);
  },

  getCategories() {
    return safeGet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategories(categories) {
    safeSet(STORAGE_KEYS.CATEGORIES, categories);
  },

  getWarehouses() {
    return safeGet(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
  },
  saveWarehouses(warehouses) {
    safeSet(STORAGE_KEYS.WAREHOUSES, warehouses);
  },

  getProducts() {
    return safeGet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  saveProducts(products) {
    safeSet(STORAGE_KEYS.PRODUCTS, products);
  },

  getReceipts() {
    return safeGet(STORAGE_KEYS.RECEIPTS, INITIAL_RECEIPTS);
  },
  saveReceipts(receipts) {
    safeSet(STORAGE_KEYS.RECEIPTS, receipts);
  },

  getDeliveries() {
    return safeGet(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
  },
  saveDeliveries(deliveries) {
    safeSet(STORAGE_KEYS.DELIVERIES, deliveries);
  },

  getTransfers() {
    return safeGet(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFERS);
  },
  saveTransfers(transfers) {
    safeSet(STORAGE_KEYS.TRANSFERS, transfers);
  },

  getAdjustments() {
    return safeGet(STORAGE_KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
  },
  saveAdjustments(adjustments) {
    safeSet(STORAGE_KEYS.ADJUSTMENTS, adjustments);
  },

  getLedger() {
    return safeGet(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
  },
  saveLedger(ledger) {
    safeSet(STORAGE_KEYS.LEDGER, ledger);
  },
};
