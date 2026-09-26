import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storageRepository } from '../services/storageRepository';
import { inventoryService, calculateTotalStock } from '../services/inventoryService';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState(() => storageRepository.getProducts());
  const [categories, setCategories] = useState(() => storageRepository.getCategories());
  const [warehouses, setWarehouses] = useState(() => storageRepository.getWarehouses());
  const [receipts, setReceipts] = useState(() => storageRepository.getReceipts());
  const [deliveries, setDeliveries] = useState(() => storageRepository.getDeliveries());
  const [transfers, setTransfers] = useState(() => storageRepository.getTransfers());
  const [adjustments, setAdjustments] = useState(() => storageRepository.getAdjustments());
  const [ledger, setLedger] = useState(() => storageRepository.getLedger());

  const [dbStatus, setDbStatus] = useState({
    connected: false,
    databaseType: 'PostgreSQL Backend',
  });

  // Sync state from Backend API
  const refreshFromBackend = useCallback(async () => {
    try {
      const health = await apiClient.getHealth();
      setDbStatus(health);

      const [prods, cats, whs, recs, dels, trfs, adjs, led] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getCategories(),
        apiClient.getWarehouses(),
        apiClient.getReceipts(),
        apiClient.getDeliveries(),
        apiClient.getTransfers(),
        apiClient.getAdjustments(),
        apiClient.getLedger(),
      ]);

      if (prods) setProducts(prods);
      if (cats) setCategories(cats);
      if (whs) setWarehouses(whs);
      if (recs) setReceipts(recs);
      if (dels) setDeliveries(dels);
      if (trfs) setTransfers(trfs);
      if (adjs) setAdjustments(adjs);
      if (led) setLedger(led);
    } catch {
      // Backend offline or unreachable, local fallback remains active
    }
  }, []);

  useEffect(() => {
    storageRepository.initialize();
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Sync to local fallback backup
  useEffect(() => {
    storageRepository.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storageRepository.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storageRepository.saveWarehouses(warehouses);
  }, [warehouses]);

  useEffect(() => {
    storageRepository.saveReceipts(receipts);
  }, [receipts]);

  useEffect(() => {
    storageRepository.saveDeliveries(deliveries);
  }, [deliveries]);

  useEffect(() => {
    storageRepository.saveTransfers(transfers);
  }, [transfers]);

  useEffect(() => {
    storageRepository.saveAdjustments(adjustments);
  }, [adjustments]);

  useEffect(() => {
    storageRepository.saveLedger(ledger);
  }, [ledger]);

  // Compute live KPIs
  const kpis = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalUnits = 0;

    products.forEach((p) => {
      const stock = calculateTotalStock(p);
      totalUnits += stock;
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= p.reorderLevel) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    const pendingReceipts = receipts.filter((r) => r.status === 'Draft' || r.status === 'Waiting').length;
    const pendingDeliveries = deliveries.filter((d) => d.status === 'Draft' || d.status === 'Waiting' || d.status === 'Ready').length;
    const internalTransfersScheduled = transfers.filter((t) => t.status === 'Draft' || t.status === 'Waiting').length;

    return {
      totalProductsInStock: products.filter((p) => calculateTotalStock(p) > 0).length,
      totalCatalogProducts: products.length,
      totalUnits,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersScheduled,
    };
  }, [products, receipts, deliveries, transfers]);

  // ACTIONS CONNECTED TO DATABASE API

  const addProduct = useCallback(async (productData) => {
    try {
      const created = await apiClient.createProduct(productData);
      await refreshFromBackend();
      showToast(`Product "${created.name}" stored in database.`, 'success');
      return created;
    } catch {
      // Local fallback execution if backend unavailable
      const existing = products.find(
        (p) => p.sku.trim().toLowerCase() === productData.sku.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`A product with SKU "${productData.sku}" already exists.`);
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

      setProducts((prev) => [newProduct, ...prev]);

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
          user: user?.name || 'Administrator',
          reason: 'Initial Product Stock Registration',
          status: 'Done',
        };
        setLedger((prev) => [entry, ...prev]);
      }

      showToast(`Product "${newProduct.name}" created.`, 'success');
      return newProduct;
    }
  }, [products, user, showToast, refreshFromBackend]);

  const updateProduct = useCallback(async (productId, updatedData) => {
    try {
      await apiClient.updateProduct(productId, updatedData);
      await refreshFromBackend();
      showToast('Product updated in database.', 'success');
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updatedData } : p))
      );
      showToast('Product updated.', 'success');
    }
  }, [refreshFromBackend, showToast]);

  const deleteProduct = useCallback(async (productId) => {
    try {
      await apiClient.deleteProduct(productId);
      await refreshFromBackend();
      showToast('Product deleted from database.', 'info');
    } catch (err) {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return;
      const currentStock = calculateTotalStock(prod);
      if (currentStock > 0) {
        throw new Error(`Cannot delete product with active stock (${currentStock} ${prod.uom}). Please adjust stock to 0 first.`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`Product "${prod.name}" has been removed.`, 'info');
    }
  }, [products, refreshFromBackend, showToast]);

  // Receipts
  const createReceipt = useCallback(async (data) => {
    try {
      const newReceipt = await apiClient.createReceipt(data);
      await refreshFromBackend();
      showToast(`Draft receipt ${newReceipt.reference} created in DB.`, 'success');
      return newReceipt;
    } catch {
      const ref = `REC-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`;
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

      setReceipts((prev) => [newReceipt, ...prev]);
      showToast(`Draft receipt ${ref} created.`, 'success');
      return newReceipt;
    }
  }, [receipts, refreshFromBackend, showToast]);

  const validateReceipt = useCallback(async (receiptId) => {
    try {
      await apiClient.validateReceipt(receiptId, user);
      await refreshFromBackend();
      showToast('Receipt validated in PostgreSQL. Stock & Ledger updated.', 'success');
    } catch (err) {
      try {
        const result = inventoryService.validateReceipt(
          { products, receipts, ledger, warehouses },
          receiptId,
          user
        );
        setProducts(result.updatedProducts);
        setReceipts(result.updatedReceipts);
        setLedger(result.updatedLedger);
        showToast('Receipt validated successfully. Stock levels updated.', 'success');
      } catch (localErr) {
        showToast(localErr.message, 'error');
        throw localErr;
      }
    }
  }, [products, receipts, ledger, warehouses, user, refreshFromBackend, showToast]);

  // Deliveries
  const createDelivery = useCallback(async (data) => {
    try {
      const newDelivery = await apiClient.createDelivery(data);
      await refreshFromBackend();
      showToast(`Delivery order ${newDelivery.reference} created in DB.`, 'success');
      return newDelivery;
    } catch {
      const ref = `DEL-${new Date().getFullYear()}-${String(deliveries.length + 1).padStart(3, '0')}`;
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

      setDeliveries((prev) => [newDelivery, ...prev]);
      showToast(`Delivery order ${ref} created.`, 'success');
      return newDelivery;
    }
  }, [deliveries, refreshFromBackend, showToast]);

  const validateDelivery = useCallback(async (deliveryId) => {
    try {
      await apiClient.validateDelivery(deliveryId, user);
      await refreshFromBackend();
      showToast('Delivery validated in PostgreSQL. Outgoing stock deducted.', 'success');
    } catch (err) {
      try {
        const result = inventoryService.validateDelivery(
          { products, deliveries, ledger, warehouses },
          deliveryId,
          user
        );
        setProducts(result.updatedProducts);
        setDeliveries(result.updatedDeliveries);
        setLedger(result.updatedLedger);
        showToast('Delivery validated. Outgoing stock deducted from warehouse.', 'success');
      } catch (localErr) {
        showToast(localErr.message, 'error');
        throw localErr;
      }
    }
  }, [products, deliveries, ledger, warehouses, user, refreshFromBackend, showToast]);

  // Transfers
  const createTransfer = useCallback(async (data) => {
    try {
      const newTransfer = await apiClient.createTransfer(data);
      await refreshFromBackend();
      showToast(`Transfer schedule ${newTransfer.reference} created in DB.`, 'success');
      return newTransfer;
    } catch {
      const ref = `TRF-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(3, '0')}`;
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

      setTransfers((prev) => [newTransfer, ...prev]);
      showToast(`Transfer schedule ${ref} created.`, 'success');
      return newTransfer;
    }
  }, [transfers, refreshFromBackend, showToast]);

  const validateTransfer = useCallback(async (transferId) => {
    try {
      await apiClient.validateTransfer(transferId, user);
      await refreshFromBackend();
      showToast('Transfer completed in PostgreSQL. Inventory relocated.', 'success');
    } catch (err) {
      try {
        const result = inventoryService.validateTransfer(
          { products, transfers, ledger, warehouses },
          transferId,
          user
        );
        setProducts(result.updatedProducts);
        setTransfers(result.updatedTransfers);
        setLedger(result.updatedLedger);
        showToast('Transfer completed. Inventory relocated.', 'success');
      } catch (localErr) {
        showToast(localErr.message, 'error');
        throw localErr;
      }
    }
  }, [products, transfers, ledger, warehouses, user, refreshFromBackend, showToast]);

  // Adjustments
  const createAdjustment = useCallback(async (data) => {
    try {
      await apiClient.createAdjustment(data, user);
      await refreshFromBackend();
      showToast('Physical count adjusted in database. Inventory reconciled.', 'success');
    } catch (err) {
      try {
        const result = inventoryService.performAdjustment(
          { products, adjustments, ledger, warehouses },
          data,
          user
        );
        setProducts(result.updatedProducts);
        setAdjustments(result.updatedAdjustments);
        setLedger(result.updatedLedger);
        showToast('Physical count adjusted. Inventory reconciled.', 'success');
      } catch (localErr) {
        showToast(localErr.message, 'error');
        throw localErr;
      }
    }
  }, [products, adjustments, ledger, warehouses, user, refreshFromBackend, showToast]);

  // Warehouses
  const addWarehouse = useCallback(async (whData) => {
    try {
      const newWh = await apiClient.createWarehouse(whData);
      await refreshFromBackend();
      showToast(`Warehouse "${newWh.name}" added to DB.`, 'success');
      return newWh;
    } catch {
      const newWh = {
        id: `WH-${String(warehouses.length + 1).padStart(2, '0')}`,
        code: whData.code.trim().toUpperCase(),
        name: whData.name.trim(),
        address: whData.address || '',
        contactPerson: whData.contactPerson || '',
        phone: whData.phone || '',
        locations: [],
      };
      setWarehouses((prev) => [...prev, newWh]);
      showToast(`Warehouse "${newWh.name}" added.`, 'success');
      return newWh;
    }
  }, [warehouses, refreshFromBackend, showToast]);

  const addLocation = useCallback(async (warehouseId, locData) => {
    try {
      const newLoc = await apiClient.createLocation(warehouseId, locData);
      await refreshFromBackend();
      showToast(`Location "${newLoc.name}" added to DB.`, 'success');
      return newLoc;
    } catch {
      const newLoc = {
        id: `LOC-${warehouseId.replace('WH-', '')}-${Date.now().toString().slice(-4)}`,
        code: locData.code.trim().toUpperCase(),
        name: locData.name.trim(),
        type: locData.type || 'Standard Storage',
      };
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === warehouseId
            ? { ...w, locations: [...(w.locations || []), newLoc] }
            : w
        )
      );
      showToast(`Location "${newLoc.name}" added to warehouse.`, 'success');
      return newLoc;
    }
  }, [refreshFromBackend, showToast]);

  const addCategory = useCallback(async (categoryName) => {
    try {
      await apiClient.createCategory(categoryName);
      await refreshFromBackend();
      showToast(`Category "${categoryName}" stored in DB.`, 'success');
    } catch {
      const trimmed = categoryName.trim();
      if (!trimmed) return;
      if (categories.includes(trimmed)) {
        throw new Error(`Category "${trimmed}" already exists.`);
      }
      setCategories((prev) => [...prev, trimmed]);
      showToast(`Category "${trimmed}" added.`, 'success');
    }
  }, [categories, refreshFromBackend, showToast]);

  const resetAllData = useCallback(async () => {
    try {
      await apiClient.resetDemoData();
      await refreshFromBackend();
      showToast('Database reset to original sample dataset.', 'info');
    } catch {
      storageRepository.resetToDefaults();
      setProducts(storageRepository.getProducts());
      setCategories(storageRepository.getCategories());
      setWarehouses(storageRepository.getWarehouses());
      setReceipts(storageRepository.getReceipts());
      setDeliveries(storageRepository.getDeliveries());
      setTransfers(storageRepository.getTransfers());
      setAdjustments(storageRepository.getAdjustments());
      setLedger(storageRepository.getLedger());
      showToast('Reset to original demo data successfully.', 'info');
    }
  }, [refreshFromBackend, showToast]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        warehouses,
        receipts,
        deliveries,
        transfers,
        adjustments,
        ledger,
        kpis,
        dbStatus,
        refreshFromBackend,
        addProduct,
        updateProduct,
        deleteProduct,
        createReceipt,
        validateReceipt,
        createDelivery,
        validateDelivery,
        createTransfer,
        validateTransfer,
        createAdjustment,
        addWarehouse,
        addLocation,
        addCategory,
        resetAllData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
