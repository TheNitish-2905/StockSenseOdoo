import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { getStockAtLocation } from '../../services/inventoryService';

export default function CreateTransferModal({
  isOpen,
  onClose,
  initialProduct = null,
}) {
  const { products, warehouses, createTransfer } = useInventory();

  const [productId, setProductId] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const pId = initialProduct?.id || products[0]?.id || '';
      setProductId(pId);

      const srcWh = warehouses[0]?.id || '';
      setSourceWarehouseId(srcWh);
      setSourceLocationId(warehouses[0]?.locations[0]?.id || '');

      const dstWh = warehouses[1]?.id || warehouses[0]?.id || '';
      setDestWarehouseId(dstWh);
      const dstWhObj = warehouses.find((w) => w.id === dstWh);
      setDestLocationId(dstWhObj?.locations[0]?.id || '');

      setQuantity('10');
      setNotes('');
      setErrors({});
    }
  }, [isOpen, initialProduct, products, warehouses]);

  const handleSourceWarehouseChange = (whId) => {
    setSourceWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setSourceLocationId(wh.locations[0].id);
    } else {
      setSourceLocationId('');
    }
  };

  const handleDestWarehouseChange = (whId) => {
    setDestWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setDestLocationId(wh.locations[0].id);
    } else {
      setDestLocationId('');
    }
  };

  const selectedProd = products.find((p) => p.id === productId);
  const availableSourceStock = selectedProd && sourceLocationId
    ? getStockAtLocation(selectedProd, sourceLocationId)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!productId) errs.productId = 'Product is required';
    if (!sourceLocationId) errs.sourceLocationId = 'Source location is required';
    if (!destLocationId) errs.destLocationId = 'Destination location is required';
    if (sourceLocationId === destLocationId) {
      errs.destLocationId = 'Destination location must be different from source';
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      errs.quantity = 'Quantity must be greater than 0';
    } else if (qtyNum > availableSourceStock) {
      errs.quantity = `Cannot transfer more than available source stock (${availableSourceStock} ${selectedProd?.uom})`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      createTransfer({
        productId,
        sourceWarehouseId,
        sourceLocationId,
        destWarehouseId,
        destLocationId,
        quantity: qtyNum,
        uom: selectedProd?.uom || 'units',
        notes,
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const srcWhObj = warehouses.find((w) => w.id === sourceWarehouseId);
  const dstWhObj = warehouses.find((w) => w.id === destWarehouseId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Internal Stock Transfer"
      subtitle="Relocate stock between racks or facilities without changing overall company total"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Schedule Transfer
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
            label="Product to Relocate"
            required
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku})`,
            }))}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            error={errors.productId}
          />
        </div>

        {/* Source vs Destination Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          {/* Source */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Origin (Source Location)
            </div>

            <Select
              label="Source Warehouse"
              required
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
              value={sourceWarehouseId}
              onChange={(e) => handleSourceWarehouseChange(e.target.value)}
            />

            <Select
              label="Source Rack / Bay"
              required
              options={(srcWhObj?.locations || []).map((l) => ({
                value: l.id,
                label: `${l.name} (${l.code})`,
              }))}
              value={sourceLocationId}
              onChange={(e) => setSourceLocationId(e.target.value)}
              error={errors.sourceLocationId}
            />

            <div className="text-[11px] text-slate-500">
              Available at source:{' '}
              <strong className={availableSourceStock > 0 ? 'text-slate-800' : 'text-rose-600'}>
                {availableSourceStock} {selectedProd?.uom}
              </strong>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Target (Destination Location)
            </div>

            <Select
              label="Destination Warehouse"
              required
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
              value={destWarehouseId}
              onChange={(e) => handleDestWarehouseChange(e.target.value)}
            />

            <Select
              label="Destination Rack / Bay"
              required
              options={(dstWhObj?.locations || []).map((l) => ({
                value: l.id,
                label: `${l.name} (${l.code})`,
              }))}
              value={destLocationId}
              onChange={(e) => setDestLocationId(e.target.value)}
              error={errors.destLocationId}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label={`Quantity to Transfer (${selectedProd?.uom || 'units'})`}
              type="number"
              min="1"
              required
              placeholder="e.g. 20"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={errors.quantity}
            />
          </div>

          <div>
            <Input
              label="Transfer Reference / Reason"
              placeholder="e.g. Replenish assembly buffer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
