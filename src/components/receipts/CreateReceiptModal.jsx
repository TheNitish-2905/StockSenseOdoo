import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { INITIAL_SUPPLIERS } from '../../constants/initialData';

export default function CreateReceiptModal({
  isOpen,
  onClose,
  initialProduct = null,
}) {
  const { products, warehouses, createReceipt } = useInventory();

  const [supplier, setSupplier] = useState(INITIAL_SUPPLIERS[0] || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', quantity: '10' },
  ]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWarehouseId(warehouses[0]?.id || '');
      setLocationId(warehouses[0]?.locations[0]?.id || '');
      if (initialProduct) {
        setItems([{ productId: initialProduct.id, quantity: String(initialProduct.reorderLevel || 20) }]);
      } else {
        setItems([{ productId: products[0]?.id || '', quantity: '10' }]);
      }
      setNotes('');
      setErrors({});
    }
  }, [isOpen, initialProduct, products, warehouses]);

  const handleWarehouseChange = (whId) => {
    setWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setLocationId(wh.locations[0].id);
    } else {
      setLocationId('');
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?.id || '', quantity: '10' }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!supplier.trim()) errs.supplier = 'Supplier name is required';
    if (!warehouseId) errs.warehouseId = 'Warehouse is required';
    if (!locationId) errs.locationId = 'Receiving rack is required';

    const validItems = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        errs.items = 'Please select a product for all rows';
        break;
      }
      const qty = Number(it.quantity);
      if (isNaN(qty) || qty <= 0) {
        errs.items = 'Quantity must be greater than 0 for all items';
        break;
      }
      const prod = products.find((p) => p.id === it.productId);
      validItems.push({
        productId: it.productId,
        quantity: qty,
        uom: prod?.uom || 'units',
      });
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      createReceipt({
        supplier,
        warehouseId,
        locationId,
        notes,
        items: validItems,
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const currentWh = warehouses.find((w) => w.id === warehouseId);
  const locationOptions = (currentWh?.locations || []).map((l) => ({
    value: l.id,
    label: `${l.name} (${l.code}) - ${l.type}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inbound Receipt"
      subtitle="Record goods arriving from vendors into storage"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Save as Draft Receipt
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Supplier / Vendor <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="suppliers-list"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Apex Metal Supplies Ltd"
              className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            <datalist id="suppliers-list">
              {INITIAL_SUPPLIERS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {errors.supplier && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.supplier}</p>
            )}
          </div>

          <div>
            <Select
              label="Receiving Warehouse"
              required
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name} (${w.code})`,
              }))}
              value={warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              error={errors.warehouseId}
            />
          </div>

          <div>
            <Select
              label="Intake Location / Bay"
              required
              options={locationOptions}
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              error={errors.locationId}
              placeholder="Select intake rack"
            />
          </div>
        </div>

        {/* Dynamic Items Lines */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Line Items ({items.length})
            </h4>
            <Button size="sm" variant="subtle" icon="add" onClick={addItemRow}>
              Add Product Line
            </Button>
          </div>

          {errors.items && (
            <p className="mb-2 text-xs text-rose-600 font-medium">{errors.items}</p>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {items.map((item, idx) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                >
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 font-mono min-w-[28px]">
                      {selectedProd?.uom || 'units'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => removeItemRow(idx)}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes / PO Number
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Inbound PO-9042 from vendor truck #14"
            className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
}
