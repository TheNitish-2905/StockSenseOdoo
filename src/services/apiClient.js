const API_BASE = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[API Client] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const apiClient = {
  // Health & DB Connection
  async getHealth() {
    return request('/health');
  },

  // Auth
  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(userData) {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async requestOTP(email) {
    return request('/auth/otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email, otp, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  // Products
  async getProducts() {
    return request('/products');
  },

  async createProduct(productData) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories() {
    return request('/categories');
  },

  async createCategory(name) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Warehouses
  async getWarehouses() {
    return request('/warehouses');
  },

  async createWarehouse(whData) {
    return request('/warehouses', {
      method: 'POST',
      body: JSON.stringify(whData),
    });
  },

  async createLocation(warehouseId, locData) {
    return request(`/warehouses/${warehouseId}/locations`, {
      method: 'POST',
      body: JSON.stringify(locData),
    });
  },

  // Receipts
  async getReceipts() {
    return request('/receipts');
  },

  async createReceipt(receiptData) {
    return request('/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  async validateReceipt(id, user) {
    return request(`/receipts/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  },

  // Deliveries
  async getDeliveries() {
    return request('/deliveries');
  },

  async createDelivery(deliveryData) {
    return request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  },

  async validateDelivery(id, user) {
    return request(`/deliveries/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  },

  // Transfers
  async getTransfers() {
    return request('/transfers');
  },

  async createTransfer(transferData) {
    return request('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  async validateTransfer(id, user) {
    return request(`/transfers/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  },

  // Adjustments
  async getAdjustments() {
    return request('/adjustments');
  },

  async createAdjustment(adjustmentData, user) {
    return request('/adjustments', {
      method: 'POST',
      body: JSON.stringify({ ...adjustmentData, user }),
    });
  },

  // Ledger
  async getLedger() {
    return request('/ledger');
  },

  // Reset Demo Data
  async resetDemoData() {
    return request('/reset-demo-data', {
      method: 'POST',
    });
  },
};
