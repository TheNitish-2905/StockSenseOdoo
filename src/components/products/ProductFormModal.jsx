import React, { useState, useEffect } from 'react';
import { useInventory } from '../../store/InventoryContext';

export default function ProductFormModal({
  isOpen,
  onClose,
  initialProduct = null,
  onSuccess,
}) {
  const { categories, warehouses, addProduct, updateProduct } = useInventory();
  const isEditing = Boolean(initialProduct);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    uom: 'units',
    reorderLevel: 10,
    costPrice: '',
    purchaseDate: '2026-09-22',
    description: '',
    initialStock: '',
    initialLocationId: '',
    warehouseLocation: 'Main Central Hub (Rack A-01)',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        sku: initialProduct.sku || '',
        category: initialProduct.category || categories[0] || 'Raw Materials',
        uom: initialProduct.uom || 'units',
        reorderLevel: initialProduct.reorderLevel ?? 10,
        costPrice: initialProduct.costPrice || '',
        purchaseDate: initialProduct.purchaseDate || '2026-09-22',
        description: initialProduct.description || '',
        initialStock: '',
        initialLocationId: '',
        warehouseLocation: 'Main Central Hub',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: categories[0] || 'Raw Materials',
        uom: 'units',
        reorderLevel: 10,
        costPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        description: '',
        initialStock: '',
        initialLocationId: warehouses[0]?.locations[0]?.id || '',
        warehouseLocation: 'Main Central Hub (Rack A-01)',
      });
    }
    setErrors({});
  }, [initialProduct, categories, warehouses, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.uom.trim()) errs.uom = 'Unit of measure is required';
    if (
      formData.reorderLevel === '' ||
      isNaN(formData.reorderLevel) ||
      Number(formData.reorderLevel) < 0
    ) {
      errs.reorderLevel = 'Reorder level must be a non-negative number';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateProduct(initialProduct.id, {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category,
          uom: formData.uom,
          reorderLevel: Number(formData.reorderLevel),
          costPrice: Number(formData.costPrice) || 0,
          purchaseDate: formData.purchaseDate,
          description: formData.description,
        });
        if (onSuccess) onSuccess(`Product "${formData.name}" updated successfully.`);
      } else {
        let locationName = formData.warehouseLocation;
        for (const w of warehouses) {
          const loc = w.locations?.find((l) => l.id === formData.initialLocationId);
          if (loc) {
            locationName = `${w.name} — ${loc.name}`;
            break;
          }
        }

        await addProduct({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category,
          uom: formData.uom,
          reorderLevel: Number(formData.reorderLevel),
          costPrice: Number(formData.costPrice) || 70,
          purchaseDate: formData.purchaseDate,
          description: formData.description,
          initialStock: Number(formData.initialStock) || 0,
          initialLocationId: formData.initialLocationId,
          initialLocationName: locationName,
        });
        if (onSuccess)
          onSuccess(
            `Product "${formData.name}" (${formData.sku.toUpperCase()}) added successfully!`
          );
      }
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
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

      {/* iOS White Card Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-slate-800 z-10 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">
                {isEditing ? 'edit_note' : 'add_box'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                {isEditing ? 'Edit Catalog Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update specifications and tracking parameters'
                  : 'Inject item directly into the active matrix'}
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

        {errors.form && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Product Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Titanium Fasteners M6"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
              {errors.name && (
                <span className="text-[11px] text-rose-600">{errors.name}</span>
              )}
            </div>

            {/* SKU */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                SKU Identifier
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TF-770"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
              />
              {errors.sku && (
                <span className="text-[11px] text-rose-600">{errors.sku}</span>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Initial Quantity & Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Initial Quantity & Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.initialStock}
                  onChange={(e) => handleChange('initialStock', e.target.value)}
                  className="w-2/3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
                />
                <input
                  type="text"
                  placeholder="kg / pcs"
                  value={formData.uom}
                  onChange={(e) => handleChange('uom', e.target.value)}
                  className="w-1/3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
                />
              </div>
            </div>

            {/* Total Price / Cost */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Unit Price / Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="₹45,000"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
              />
            </div>

            {/* Warehouse & Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Warehouse & Location
              </label>
              <input
                type="text"
                placeholder="Main Warehouse (Rack C-10)"
                value={formData.warehouseLocation}
                onChange={(e) => handleChange('warehouseLocation', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Reorder Alert Threshold */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Reorder Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                placeholder="25"
                value={formData.reorderLevel}
                onChange={(e) => handleChange('reorderLevel', e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Product Description
            </label>
            <textarea
              rows="2"
              placeholder="Precision grade specifications and metallurgical standards..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
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
              {submitting
                ? 'Processing...'
                : isEditing
                ? 'Save Changes'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
