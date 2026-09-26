import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { getStockAtLocation } from '../../services/inventoryService';

export default function AdjustStockModal({
  isOpen,
  onClose,
  initialProduct = null,
}) {
  const { products, warehouses, createAdjustment } = useInventory();

  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState('Physical audit count reconciliation');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setProductId(initialProduct.id);
      // Pick the first location with stock or first location available
      const locKeys = Object.keys(initialProduct.stockByLocation || {});
      if (locKeys.length > 0) {
        const firstLocId = locKeys[0];
        setLocationId(firstLocId);
        // Find warehouse for this location
        for (const w of warehouses) {
          if (w.locations.some((l) => l.id === firstLocId)) {
            setWarehouseId(w.id);
            break;
          }
        }
      } else {
        setWarehouseId(warehouses[0]?.id || '');
        setLocationId(warehouses[0]?.locations[0]?.id || '');
      }
      setCountedQty('');
    } else {
      setProductId(products[0]?.id || '');
      setWarehouseId(warehouses[0]?.id || '');
      setLocationId(warehouses[0]?.locations[0]?.id || '');
      setCountedQty('');
    }
    setErrors({});
  }, [initialProduct, products, warehouses, isOpen]);

  // When warehouse changes, set location to first location of that warehouse
  const handleWarehouseChange = (whId) => {
    setWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setLocationId(wh.locations[0].id);
    } else {
      setLocationId('');
    }
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const currentSystemStock = selectedProduct && locationId
    ? getStockAtLocation(selectedProduct, locationId)
    : 0;

  const countedNum = Number(countedQty);
  const isValidCount = countedQty !== '' && !isNaN(countedNum) && countedNum >= 0;
  const difference = isValidCount ? countedNum - currentSystemStock : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!productId) errs.productId = 'Select a product';
    if (!locationId) errs.locationId = 'Select a location';
    if (countedQty === '' || isNaN(countedNum) || countedNum < 0) {
      errs.countedQty = 'Enter a valid non-negative counted quantity';
    }
    if (!reason.trim()) errs.reason = 'Please enter an audit reason';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      createAdjustment({
        productId,
        warehouseId,
        locationId,
        countedQuantity: countedNum,
        reason,
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const currentWarehouseObj = warehouses.find((w) => w.id === warehouseId);
  const locationOptions = (currentWarehouseObj?.locations || []).map((l) => ({
    value: l.id,
    label: `${l.name} (${l.code}) - ${l.type}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Stock Adjustment"
      subtitle="Reconcile recorded system stock with physical shelf count"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Apply Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
            {errors.form}
          </div>
        )}

        <div>
          <Select
            label="Product to Adjust"
            required
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku})`,
            }))}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            error={errors.productId}
            placeholder="Select product"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Warehouse"
              required
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
              value={warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="Location / Rack"
              required
              options={locationOptions}
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              error={errors.locationId}
              placeholder="Select location"
            />
          </div>
        </div>

        {/* Real-time Reconciliation Box */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Recorded System Stock:</span>
            <span className="font-semibold text-slate-800 text-sm">
              {currentSystemStock} {selectedProduct?.uom}
            </span>
          </div>

          <div>
            <Input
              label="Physical Counted Quantity"
              type="number"
              min="0"
              required
              placeholder="e.g. 97"
              value={countedQty}
              onChange={(e) => {
                setCountedQty(e.target.value);
                if (errors.countedQty) setErrors((prev) => ({ ...prev, countedQty: null }));
              }}
              error={errors.countedQty}
              helperText="Enter the actual physical count found at this location"
            />
          </div>

          {difference !== null && (
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Calculated Discrepancy:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  difference > 0
                    ? 'text-emerald-600'
                    : difference < 0
                    ? 'text-rose-600'
                    : 'text-slate-700'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference} {selectedProduct?.uom}
              </span>
            </div>
          )}
        </div>

        <div>
          <Select
            label="Adjustment Reason"
            required
            options={[
              'Physical audit count reconciliation',
              'Damaged in handling / storage',
              'Spoilage / Expiry',
              'Counting error correction',
              'Theft / Unaccounted loss',
              'Routine cycle audit',
            ]}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
          />
        </div>
      </form>
    </Modal>
  );
}
