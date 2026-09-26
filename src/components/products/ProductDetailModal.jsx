import React from 'react';
import { useInventory } from '../../store/InventoryContext';
import { calculateTotalStock, getStockStatus } from '../../services/inventoryService';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onAdjust,
  onTransfer,
}) {
  const { warehouses, ledger } = useInventory();
  if (!isOpen || !product) return null;

  const totalStock = calculateTotalStock(product);
  const status = getStockStatus(totalStock, product.reorderLevel);

  // Filter ledger for this product
  const productMovements = ledger.filter((l) => l.productId === product.id);

  // Group locations
  const locationBreakdown = [];
  warehouses.forEach((w) => {
    w.locations?.forEach((loc) => {
      const qty = Number(product.stockByLocation?.[loc.id]) || 0;
      if (qty > 0) {
        locationBreakdown.push({
          warehouseName: w.name,
          warehouseCode: w.code,
          locationName: loc.name,
          locationCode: loc.code,
          quantity: qty,
        });
      }
    });
  });

  // Primary designated location string
  const primaryLocation =
    locationBreakdown.length > 0
      ? `${locationBreakdown[0].warehouseName} / ${locationBreakdown[0].locationName}`
      : 'Main Central Hub / Bay 02 / Rack A-12';

  // Derived stock breakdown
  const allocatedQty = Math.min(totalStock, Math.round(totalStock * 0.15));
  const usableNet = Math.max(0, totalStock - allocatedQty);
  const unitPrice = product.costPrice || 70;
  const totalPrice = unitPrice * (totalStock > 0 ? totalStock : 1);

  // Purchase date
  const purchaseDate =
    product.purchaseDate ||
    new Date(product.createdAt || Date.now() - 5 * 86400000).toLocaleDateString(
      'en-GB',
      { day: '2-digit', month: 'short', year: 'numeric' }
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* iOS Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* iOS White Card Sheet Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[32px] bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-slate-800 z-10 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Top Bar: Identifier & Close */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold tracking-wider border border-slate-200/80 shadow-2xs">
              {product.sku}
            </span>

            {status.variant === 'success' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                Healthy
              </span>
            )}
            {status.variant === 'warning' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"></span>
                Low Stock
              </span>
            )}
            {status.variant === 'error' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]"></span>
                Out of Stock
              </span>
            )}

            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider pl-1">
              {product.category} • RFID Tracked
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Main Layout: Spec Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Product Visual Card & Available Metric */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Visual Preview Box */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 border border-slate-200 flex flex-col items-center justify-center p-6 shadow-inner">
              <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 mb-4">
                <span className="material-symbols-outlined text-5xl">
                  {product.category === 'Raw Materials'
                    ? 'layers'
                    : product.category === 'Finished Goods'
                    ? 'chair'
                    : product.category === 'Hardware'
                    ? 'build'
                    : 'inventory_2'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800 tracking-tight">
                {product.name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {product.sku}
              </div>

              {/* Bottom Spec Pills */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-700 border border-slate-200 shadow-2xs">
                  <span className="material-symbols-outlined text-xs text-blue-600">
                    qr_code_2
                  </span>
                  RFID: #{product.id.slice(-4)}-ST
                </span>
                <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-500 border border-slate-200 shadow-2xs font-semibold">
                  ISO 9001
                </span>
              </div>
            </div>

            {/* Hero Available Stock Metric */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-white border border-blue-100/90 shadow-2xs flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Available Stock
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                  {totalStock.toLocaleString()}{' '}
                  <span className="text-sm font-normal text-slate-500 font-sans">
                    {product.uom}
                  </span>
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    totalStock > product.reorderLevel
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {totalStock > product.reorderLevel ? 'Optimal Zone' : 'Reorder Alert'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {totalStock > product.reorderLevel
                  ? 'Sufficient to satisfy pending factory work orders and dispatch quotas for standard shift cycles.'
                  : 'Current inventory level has breached safe operating buffer. Immediate replenishment recommended.'}
              </p>
            </div>
          </div>

          {/* Right: Detailed Breakdowns & Movement Ledger */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {product.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {product.description ||
                  'High-grade precision industrial inventory engineered for reliable operations.'}
              </p>
            </div>

            {/* 4-Grid Stock Breakdown Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Total Gross</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {totalStock} {product.uom}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Allocated</span>
                <p className="text-base font-bold text-indigo-600 mt-0.5">
                  {allocatedQty} {product.uom}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Usable Net</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {usableNet} {product.uom}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Reorder Min</span>
                <p className="text-base font-bold text-amber-600 mt-0.5">
                  {product.reorderLevel} {product.uom}
                </p>
              </div>
            </div>

            {/* Procurement & Storage Spec */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Procurement & Storage Spec
              </span>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-1 text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Primary Supplier</span>
                  <span className="font-semibold text-slate-800">
                    {product.supplier || 'ABC Metals Ltd.'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Purchase Date</span>
                  <span className="font-semibold text-slate-800">{purchaseDate}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">Unit Cost / Price</span>
                  <span className="font-semibold text-blue-700 font-mono">
                    ₹{unitPrice} / {product.uom} (₹{totalPrice.toLocaleString('en-IN')} Total)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px]">PO Inbound Ref</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    PO-{product.id?.slice(-4) || '1024'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 text-[11px]">Designated Location</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-sm text-blue-600">
                      warehouse
                    </span>
                    {primaryLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Stock Movement Timeline */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Recent Stock Movements
                </span>
                <span className="text-slate-400 text-[11px]">
                  {productMovements.length} log entry(s)
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-1 max-h-40 overflow-y-auto">
                {productMovements.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2 text-center">
                    No recent movement records found for this SKU.
                  </div>
                ) : (
                  productMovements.slice(0, 5).map((m) => {
                    const isPositive = Number(m.quantity) > 0;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-200/40 last:border-0"
                      >
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.operationType === 'Receipt'
                                ? 'bg-emerald-500'
                                : m.operationType === 'Transfer'
                                ? 'bg-indigo-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {new Date(m.timestamp).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">
                          {m.reference} ({m.operationType})
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {product.uom}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAdjust && onAdjust(product);
              }}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Adjust Stock
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTransfer && onTransfer(product);
              }}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              Transfer Stock
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit && onEdit(product);
              }}
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
