// Centralized Stock Engine for StockSense

export function calculateTotalStock(product) {
  if (!product || !product.stockByLocation) return 0;
  return Object.values(product.stockByLocation).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
}

export function getStockAtLocation(product, locationId) {
  if (!product || !product.stockByLocation) return 0;
  return Number(product.stockByLocation[locationId]) || 0;
}

export function getStockStatus(totalStock, reorderLevel) {
  if (totalStock <= 0) return { label: 'Out of Stock', variant: 'error' };
  if (totalStock <= reorderLevel) return { label: 'Low Stock', variant: 'warning' };
  return { label: 'In Stock', variant: 'success' };
}

export function findLocationName(warehouses, locationId) {
  for (const wh of warehouses) {
    const loc = wh.locations?.find((l) => l.id === locationId);
    if (loc) {
      return `${wh.name} — ${loc.name}`;
    }
  }
  return locationId || 'Unknown Location';
}

export const inventoryService = {
  // Validate receipt and update stock + ledger
  validateReceipt({ products, receipts, ledger, warehouses }, receiptId, currentUser) {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) throw new Error('Receipt not found');
    if (receipt.status === 'Done') throw new Error('Receipt has already been validated');

    const updatedProducts = products.map((p) => ({ ...p, stockByLocation: { ...p.stockByLocation } }));
    const newLedgerEntries = [];
    const now = new Date().toISOString();
    const destLocName = findLocationName(warehouses, receipt.locationId);

    receipt.items.forEach((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      if (!prod) return;

      const prevTotal = calculateTotalStock(prod);
      const prevLocStock = getStockAtLocation(prod, receipt.locationId);
      const newLocStock = prevLocStock + Number(item.quantity);
      prod.stockByLocation[receipt.locationId] = newLocStock;
      const newTotal = calculateTotalStock(prod);

      newLedgerEntries.push({
        id: `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: now,
        reference: receipt.reference,
        operationType: 'Receipt',
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        sourceLocation: `Vendor: ${receipt.supplier}`,
        destLocation: destLocName,
        quantity: Number(item.quantity),
        uom: item.uom || prod.uom,
        previousStock: prevTotal,
        newStock: newTotal,
        user: currentUser?.name || 'Authorized Staff',
        reason: receipt.notes || 'Inbound vendor receipt validated',
        status: 'Done',
      });
    });

    const updatedReceipts = receipts.map((r) =>
      r.id === receiptId
        ? {
            ...r,
            status: 'Done',
            validatedAt: now,
            validatedBy: currentUser?.name || 'Authorized Staff',
          }
        : r
    );

    return {
      updatedProducts,
      updatedReceipts,
      updatedLedger: [...newLedgerEntries, ...ledger],
    };
  },

  // Validate delivery and deduct stock + ledger
  validateDelivery({ products, deliveries, ledger, warehouses }, deliveryId, currentUser) {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new Error('Delivery not found');
    if (delivery.status === 'Done') throw new Error('Delivery has already been validated');
    if (delivery.status === 'Canceled') throw new Error('Cannot validate a canceled delivery');

    // Check stock availability first across all items
    for (const item of delivery.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Product not found for item ID: ${item.productId}`);
      const available = getStockAtLocation(prod, delivery.locationId);
      if (available < Number(item.quantity)) {
        throw new Error(
          `Insufficient stock for "${prod.name}" at ${findLocationName(warehouses, delivery.locationId)}. Available: ${available} ${prod.uom}, Requested: ${item.quantity} ${prod.uom}`
        );
      }
    }

    const updatedProducts = products.map((p) => ({ ...p, stockByLocation: { ...p.stockByLocation } }));
    const newLedgerEntries = [];
    const now = new Date().toISOString();
    const sourceLocName = findLocationName(warehouses, delivery.locationId);

    delivery.items.forEach((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      if (!prod) return;

      const prevTotal = calculateTotalStock(prod);
      const prevLocStock = getStockAtLocation(prod, delivery.locationId);
      const newLocStock = Math.max(0, prevLocStock - Number(item.quantity));
      prod.stockByLocation[delivery.locationId] = newLocStock;
      const newTotal = calculateTotalStock(prod);

      newLedgerEntries.push({
        id: `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: now,
        reference: delivery.reference,
        operationType: 'Delivery',
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        sourceLocation: sourceLocName,
        destLocation: `Customer: ${delivery.customer}`,
        quantity: -Number(item.quantity),
        uom: item.uom || prod.uom,
        previousStock: prevTotal,
        newStock: newTotal,
        user: currentUser?.name || 'Authorized Staff',
        reason: delivery.notes || 'Outbound customer delivery order fulfilled',
        status: 'Done',
      });
    });

    const updatedDeliveries = deliveries.map((d) =>
      d.id === deliveryId
        ? {
            ...d,
            status: 'Done',
            validatedAt: now,
            validatedBy: currentUser?.name || 'Authorized Staff',
          }
        : d
    );

    return {
      updatedProducts,
      updatedDeliveries,
      updatedLedger: [...newLedgerEntries, ...ledger],
    };
  },

  // Validate internal transfer
  validateTransfer({ products, transfers, ledger, warehouses }, transferId, currentUser) {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'Done') throw new Error('Transfer has already been completed');
    if (transfer.status === 'Canceled') throw new Error('Cannot complete a canceled transfer');

    const prod = products.find((p) => p.id === transfer.productId);
    if (!prod) throw new Error('Product not found');

    const sourceStock = getStockAtLocation(prod, transfer.sourceLocationId);
    if (sourceStock < Number(transfer.quantity)) {
      throw new Error(
        `Insufficient source stock for "${prod.name}". Available: ${sourceStock} ${prod.uom}, Transfer amount: ${transfer.quantity} ${prod.uom}`
      );
    }

    const updatedProducts = products.map((p) => {
      if (p.id !== transfer.productId) return p;
      const newStockByLoc = { ...p.stockByLocation };
      const curSrc = Number(newStockByLoc[transfer.sourceLocationId]) || 0;
      const curDst = Number(newStockByLoc[transfer.destLocationId]) || 0;

      newStockByLoc[transfer.sourceLocationId] = curSrc - Number(transfer.quantity);
      newStockByLoc[transfer.destLocationId] = curDst + Number(transfer.quantity);

      return { ...p, stockByLocation: newStockByLoc };
    });

    const totalStock = calculateTotalStock(prod);
    const now = new Date().toISOString();
    const sourceLocName = findLocationName(warehouses, transfer.sourceLocationId);
    const destLocName = findLocationName(warehouses, transfer.destLocationId);

    const ledgerEntry = {
      id: `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      reference: transfer.reference,
      operationType: 'Transfer',
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      sourceLocation: sourceLocName,
      destLocation: destLocName,
      quantity: Number(transfer.quantity),
      uom: transfer.uom || prod.uom,
      previousStock: totalStock,
      newStock: totalStock,
      user: currentUser?.name || 'Authorized Staff',
      reason: transfer.notes || 'Internal stock relocation completed',
      status: 'Done',
    };

    const updatedTransfers = transfers.map((t) =>
      t.id === transferId
        ? {
            ...t,
            status: 'Done',
            validatedAt: now,
            validatedBy: currentUser?.name || 'Authorized Staff',
          }
        : t
    );

    return {
      updatedProducts,
      updatedTransfers,
      updatedLedger: [ledgerEntry, ...ledger],
    };
  },

  // Perform physical inventory adjustment
  performAdjustment({ products, adjustments, ledger, warehouses }, adjustmentData, currentUser) {
    const { productId, warehouseId, locationId, countedQuantity, reason } = adjustmentData;
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const counted = Number(countedQuantity);
    if (isNaN(counted) || counted < 0) throw new Error('Counted quantity must be a non-negative number');

    const prevLocationStock = getStockAtLocation(prod, locationId);
    const difference = counted - prevLocationStock;
    const prevTotal = calculateTotalStock(prod);

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        stockByLocation: {
          ...p.stockByLocation,
          [locationId]: counted,
        },
      };
    });

    const updatedProduct = updatedProducts.find((p) => p.id === productId);
    const newTotal = calculateTotalStock(updatedProduct);
    const now = new Date().toISOString();
    const ref = `ADJ-${Date.now().toString().slice(-6)}`;
    const locationName = findLocationName(warehouses, locationId);

    const newAdjustment = {
      id: ref,
      reference: ref,
      warehouseId,
      locationId,
      productId,
      previousQuantity: prevLocationStock,
      countedQuantity: counted,
      difference,
      uom: prod.uom,
      reason: reason || 'Inventory cycle count reconciliation',
      adjustedBy: currentUser?.name || 'Authorized Staff',
      createdAt: now,
      status: 'Done',
    };

    const ledgerEntry = {
      id: `LED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      reference: ref,
      operationType: 'Adjustment',
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      sourceLocation: locationName,
      destLocation: 'Physical Count Adjustment',
      quantity: difference,
      uom: prod.uom,
      previousStock: prevTotal,
      newStock: newTotal,
      user: currentUser?.name || 'Authorized Staff',
      reason: reason || 'Manual count reconciliation',
      status: 'Done',
    };

    return {
      updatedProducts,
      updatedAdjustments: [newAdjustment, ...adjustments],
      updatedLedger: [ledgerEntry, ...ledger],
    };
  },
};
