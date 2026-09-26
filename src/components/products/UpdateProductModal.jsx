import React, { useState, useEffect } from 'react';
import { useInventory } from '../../store/InventoryContext';
import { calculateTotalStock } from '../../services/inventoryService';

export default function UpdateProductModal({
  isOpen,
  onClose,
  initialProduct = null,
  onSuccess,
}) {
  const { products, warehouses, updateProduct } = useInventory();

  const [selectedSku, setSelectedSku] = useState(
    initialProduct?.sku || (products[0]?.sku ?? '')
  );
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [locationName, setLocationName] = useState('Main Warehouse');
  const [submitting, setSubmitting] = useState(false);

  // Sync fields when selectedSku changes
  useEffect(() => {
    if (!products.length) return;
    const current =
      products.find((p) => p.sku === selectedSku) ||
      (initialProduct ? products.find((p) => p.id === initialProduct.id) : products[0]);

    if (current) {
      setSelectedSku(current.sku);
      setProductName(current.name || '');
      const stock = calculateTotalStock(current);
      setQuantity(`${stock} ${current.uom || 'units'}`);
      const estPrice = (current.costPrice || 70) * (stock || 1);
      setPrice(`₹${estPrice.toLocaleString('en-IN')}`);

      // Find first warehouse location name
      let locLabel = 'Main Warehouse';
      if (current.stockByLocation) {
        const locId = Object.keys(current.stockByLocation)[0];
        for (const w of warehouses) {
          const l = w.locations?.find((loc) => loc.id === locId);
          if (l) {
            locLabel = `${w.name} (${l.name})`;
            break;
          }
        }
      }
      setLocationName(locLabel);
    }
  }, [selectedSku, products, initialProduct, warehouses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const current = products.find((p) => p.sku === selectedSku);
    if (!current) return;

    setSubmitting(true);
    try {
      // Parse numeric price if possible
      const rawPriceNum = Number(price.replace(/[^0-9.]/g, '')) || current.costPrice || 70;
      await updateProduct(current.id, {
        name: productName,
        costPrice: rawPriceNum,
      });

      if (onSuccess) {
        onSuccess(`Product ${selectedSku} updated successfully.`);
      }
      onClose();
    } catch {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* iOS Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* iOS White Card Box */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 text-slate-800 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">edit_note</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                Update Catalog Record
              </h3>
              <p className="text-xs text-slate-500">
                Modify SKU telemetry & inventory parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Select Product to Modify
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
            >
              {products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Product Name
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quantity On-Hand
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 120 kg"
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Price / Valuation
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹8,400"
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Location / Rack
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Main Central Hub"
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
