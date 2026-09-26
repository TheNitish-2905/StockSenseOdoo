import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProductList from '../components/products/ProductList';
import ProductFormModal from '../components/products/ProductFormModal';
import UpdateProductModal from '../components/products/UpdateProductModal';
import ProductDetailModal from '../components/products/ProductDetailModal';
import AdjustStockModal from '../components/products/AdjustStockModal';
import { useInventory } from '../store/InventoryContext';
import { calculateTotalStock, getStockStatus } from '../services/inventoryService';

export default function ProductsPage({
  onOpenCreateTransfer,
  onOpenCreateReceipt,
}) {
  const { products, categories, warehouses, deliveries, deleteProduct } = useInventory();

  // View & panel toggles
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsRef = useRef(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'healthy', 'low', 'out'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteSelectModalOpen, setDeleteSelectModalOpen] = useState(false);

  // Floating iOS Toast HUD
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live portfolio metrics
  const totalCount = products.length;
  const healthyProducts = useMemo(
    () => products.filter((p) => calculateTotalStock(p) > p.reorderLevel),
    [products]
  );
  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const stock = calculateTotalStock(p);
        return stock > 0 && stock <= p.reorderLevel;
      }),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => products.filter((p) => calculateTotalStock(p) <= 0),
    [products]
  );

  const healthyPct = totalCount ? ((healthyProducts.length / totalCount) * 100).toFixed(1) : 0;
  const lowPct = totalCount ? ((lowStockProducts.length / totalCount) * 100).toFixed(1) : 0;
  const outPct = totalCount ? ((outOfStockProducts.length / totalCount) * 100).toFixed(1) : 0;
  const bufferPct = Math.max(0, (100 - Number(healthyPct) - Number(lowPct) - Number(outPct))).toFixed(1);

  const pendingWorkOrders = deliveries.filter(
    (d) => d.status !== 'Done' && d.status !== 'Cancelled'
  ).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      const totalStock = calculateTotalStock(p);
      const status = getStockStatus(totalStock, p.reorderLevel);

      if (statusFilter === 'healthy' && status.variant !== 'success') return false;
      if (statusFilter === 'low' && status.variant !== 'warning') return false;
      if (statusFilter === 'out' && status.variant !== 'error') return false;

      // Category filter
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

      // Warehouse filter
      if (warehouseFilter !== 'ALL') {
        const wh = warehouses.find((w) => w.id === warehouseFilter || w.code === warehouseFilter);
        if (wh) {
          const locIds = (wh.locations || []).map((l) => l.id);
          const hasStockInWh = Object.keys(p.stockByLocation || {}).some(
            (locId) => locIds.includes(locId) && p.stockByLocation[locId] > 0
          );
          if (!hasStockInWh) return false;
        }
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat && !matchDesc) return false;
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, warehouseFilter, search, warehouses]);

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    const name = deletingProduct.name;
    const sku = deletingProduct.sku;
    deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
    triggerToast(`Product "${name}" (${sku}) archived from catalog.`, 'alert');
  };

  return (
    <div className="relative w-full pb-16 select-none text-left">
      {/* Ambient Specular Aurora Halos (Premium iOS Light Palette) */}
      <div className="pointer-events-none absolute -top-40 right-10 w-[550px] h-[550px] bg-gradient-to-br from-blue-100/50 via-sky-50/40 to-transparent rounded-full blur-[130px] -z-10" />
      <div className="pointer-events-none absolute top-[400px] -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-50/50 via-slate-100/60 to-transparent rounded-full blur-[140px] -z-10" />

      {/* Header & Primary Action Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pt-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
            <span className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">
              Product Catalog
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Real-time Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Products Matrix
          </h2>
        </div>

        {/* Dual Action Buttons Container */}
        <div className="flex items-center gap-3 relative">
          {/* Inventory Analytics Toggle Button */}
          <button
            type="button"
            id="analytics-toggle-btn"
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            className={`group relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full border transition-all active:scale-[0.98] shadow-sm ${
              analyticsOpen
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                analyticsOpen
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
              }`}
            >
              {analyticsOpen ? (
                <span className="material-symbols-outlined text-sm leading-none">close</span>
              ) : (
                <svg
                  className="w-3.5 h-3.5 stroke-current"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-tight">
              {analyticsOpen ? 'Close Analytics' : 'Inventory Analytics'}
            </span>
            {!analyticsOpen && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                4 metrics
              </span>
            )}
          </button>

          {/* Product Actions Button & Floating iOS Context Menu */}
          <div className="relative" ref={actionsRef}>
            <button
              type="button"
              id="productActionsBtn"
              onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
              className="group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all active:scale-[0.98]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm leading-none">
                  auto_awesome
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                Product Actions
              </span>
              <span
                className={`material-symbols-outlined text-slate-300 text-base transition-transform duration-200 ${
                  actionsMenuOpen ? 'rotate-180 text-white' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Floating iOS Context Menu */}
            {actionsMenuOpen && (
              <div
                id="productContextMenu"
                className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl p-1.5 z-40 flex flex-col gap-1 transition-all origin-top-right animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActionsMenuOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">add</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Add Product
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Create new inventory item
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionsMenuOpen(false);
                    setUpdateModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">sync</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Update Product
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Edit existing specs
                    </span>
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2" />

                <button
                  type="button"
                  onClick={() => {
                    setActionsMenuOpen(false);
                    if (products.length > 0) {
                      setDeletingProduct(products[0]);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-rose-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-2xs group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-600">
                      Delete Product
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Archive catalog record
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* KPI STRIP VS EXPANDABLE INVENTORY ANALYTICS PANEL (MUTUALLY EXCLUSIVE)    */}
      {/* ========================================================================= */}
      <div className="relative mb-6" id="kpi-analytics-wrapper">
        {!analyticsOpen ? (
          /* Default 4 Metric iOS Glass Strip */
          <section
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300"
            id="kpi-cards-container"
          >
            {/* Metric 1: Total SKU Portfolio */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Total SKU Portfolio
                </span>
                <span className="material-symbols-outlined text-blue-600 text-lg">widgets</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
                  {totalCount.toLocaleString()}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  +4.2%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[82%] shadow-xs" />
              </div>
            </div>

            {/* Metric 2: Healthy Stock */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Healthy Stock
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] shadow-[0_0_8px_#34C759]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
                  {healthyProducts.length.toLocaleString()}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                  {healthyPct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#34C759] rounded-full shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(10, healthyPct))}%` }}
                />
              </div>
            </div>

            {/* Metric 3: Low Stock Warning */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Low Stock Warning
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500] shadow-[0_0_8px_#FF9500] animate-ping" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FF9500] font-mono">
                  {lowStockProducts.length.toLocaleString()}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                  {lowPct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#FF9500] rounded-full shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(5, lowPct * 4))}%` }}
                />
              </div>
            </div>

            {/* Metric 4: Out of Stock Critical */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Out of Stock Critical
                </span>
                <span className="material-symbols-outlined text-rose-500 text-lg">warning</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 font-mono">
                  {outOfStockProducts.length.toLocaleString()}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200/60">
                  Action Req.
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(4, outPct * 5))}%` }}
                />
              </div>
            </div>
          </section>
        ) : (
          /* Expanded Liquid Glass Analytics Panel (Premium White iOS Style) */
          <section
            className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all duration-300"
            id="analytics-panel"
          >
            {/* Top Row: Title + Mini KPI Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                  <svg
                    className="w-4 h-4 stroke-current"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">
                    Inventory Analytics
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    Stock Health Overview
                  </span>
                </div>
              </div>

              {/* Mini Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shadow-2xs" />
                  <span className="text-slate-500 font-sans">Total:</span>
                  <span className="font-bold text-slate-900">{totalCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_#34C759]" />
                  <span className="text-emerald-700 font-sans font-medium">Healthy:</span>
                  <span className="font-bold text-emerald-800">
                    {healthyProducts.length} ({healthyPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#FF9500] shadow-[0_0_6px_#FF9500]" />
                  <span className="text-amber-700 font-sans font-medium">Low:</span>
                  <span className="font-bold text-amber-800">
                    {lowStockProducts.length} ({lowPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                  <span className="text-rose-700 font-sans font-medium">Critical:</span>
                  <span className="font-bold text-rose-800">
                    {outOfStockProducts.length} ({outPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Centerpiece Interactive Segmented Health Band */}
            <div className="pt-4 pb-2">
              <div className="relative w-full h-7 rounded-full bg-slate-100 p-1 flex items-center shadow-inner overflow-visible">
                {/* Healthy Segment */}
                <div
                  className="relative group h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm transition-all cursor-pointer hover:brightness-110"
                  style={{ width: `${Math.max(4, Number(healthyPct))}%` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full" />
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 font-medium">
                    Healthy Stock: {healthyProducts.length} SKUs ({healthyPct}%)
                  </div>
                </div>

                {/* Low Stock Segment */}
                <div
                  className="relative group h-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm transition-all cursor-pointer hover:brightness-110"
                  style={{ width: `${Math.max(2, Number(lowPct))}%` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30" />
                  <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-lg text-xs text-amber-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 font-medium">
                    Low Stock Warning: {lowStockProducts.length} SKUs ({lowPct}%)
                  </div>
                </div>

                {/* Critical Out of Stock Segment */}
                <div
                  className="relative group h-full bg-gradient-to-r from-rose-500 to-red-500 shadow-sm transition-all cursor-pointer hover:brightness-110"
                  style={{ width: `${Math.max(2, Number(outPct))}%`, minWidth: '8px' }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30" />
                  <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-lg text-xs text-rose-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 font-medium">
                    Out of Stock Critical: {outOfStockProducts.length} SKUs ({outPct}%)
                  </div>
                </div>

                {/* In-Transit / Buffer Segment */}
                <div
                  className="relative group h-full rounded-r-full bg-gradient-to-r from-slate-200 to-slate-300 border-l border-white/40 transition-all cursor-pointer hover:bg-slate-300"
                  style={{ width: `${Math.max(4, Number(bufferPct))}%` }}
                >
                  <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-lg text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 font-medium">
                    In-Transit / Unallocated Buffer: {bufferPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Secondary Velocity Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500">Turnover Velocity</span>
                <span className="font-semibold text-blue-600 font-mono">14.2 days</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500">Stockout Risk Index</span>
                <span className="font-semibold text-emerald-600 font-mono">
                  {outOfStockProducts.length > 0 ? 'Medium (0.12)' : 'Low (0.04)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500">Backorder Queued</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {pendingWorkOrders} Work Orders
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500">Audit Compliance</span>
                <span className="font-semibold text-indigo-600 font-mono">99.8% ISO</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FILTER & CONTROLS SEGMENT                                                 */}
      {/* ========================================================================= */}
      <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-4">
        {/* Status Filter Pills (iOS Segmented pill style) */}
        <div
          className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200/70 gap-1 overflow-x-auto shadow-2xs"
          id="filterStatusGroup"
        >
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`filter-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('healthy')}
            className={`filter-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'healthy'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            Healthy
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('low')}
            className={`filter-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'low'
                ? 'bg-white text-amber-700 shadow-sm border border-amber-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
            Low Stock
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('out')}
            className={`filter-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'out'
                ? 'bg-white text-rose-700 shadow-sm border border-rose-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Out of Stock
          </button>
        </div>

        {/* Dynamic Table Search & Dropdown Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex items-center flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-sm pointer-events-none">
              search
            </span>
            <input
              type="text"
              id="productSearchInput"
              placeholder="Filter rows in real-time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-all cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Warehouse Dropdown */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-all cursor-pointer"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRODUCTS MATRIX TABLE CONTAINER                                           */}
      {/* ========================================================================= */}
      <ProductList
        products={filteredProducts}
        totalCatalogCount={products.length}
        onViewProduct={(p) => setDetailProduct(p)}
        onEditProduct={(p) => setEditingProduct(p)}
        onDeleteProduct={(p) => setDeletingProduct(p)}
        onAdjustStock={(p) => setAdjustingProduct(p)}
        onAddProduct={() => setCreateModalOpen(true)}
      />

      {/* ========================================================================= */}
      {/* MODAL A: SIGNATURE PRODUCT DETAIL SHEET                                   */}
      {/* ========================================================================= */}
      <ProductDetailModal
        isOpen={Boolean(detailProduct)}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEdit={(p) => setEditingProduct(p)}
        onAdjust={(p) => setAdjustingProduct(p)}
        onTransfer={(p) => onOpenCreateTransfer && onOpenCreateTransfer(p)}
      />

      {/* ========================================================================= */}
      {/* MODAL B: ADD PRODUCT MODAL                                                */}
      {/* ========================================================================= */}
      <ProductFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(msg) => triggerToast(msg, 'success')}
      />

      {/* ========================================================================= */}
      {/* MODAL C: UPDATE PRODUCT MODAL                                             */}
      {/* ========================================================================= */}
      <UpdateProductModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onSuccess={(msg) => triggerToast(msg, 'success')}
      />

      {/* Product Form Modal (for editing specific product) */}
      <ProductFormModal
        isOpen={Boolean(editingProduct)}
        initialProduct={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(msg) => triggerToast(msg, 'success')}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={Boolean(adjustingProduct)}
        initialProduct={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />

      {/* ========================================================================= */}
      {/* MODAL D: DELETE CONFIRMATION DIALOG (IOS WHITE DESIGN)                    */}
      {/* ========================================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setDeletingProduct(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-slate-800 z-10 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Delete Catalog Product?
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-slate-800 font-semibold">
                {deletingProduct.sku} ({deletingProduct.name})
              </strong>{' '}
              from the active catalog? This action will archive historical stock ledgers.
            </p>
            <div className="w-full flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="w-1/2 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING IOS TOAST NOTIFICATION HUD                                       */}
      {/* ========================================================================= */}
      <div
        className={`pointer-events-none fixed bottom-6 right-6 z-50 transform transition-all duration-300 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 text-white backdrop-blur-xl shadow-xl ${
          toast.visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
        id="glassToast"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            toast.type === 'alert'
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {toast.type === 'alert' ? 'delete' : 'check'}
          </span>
        </div>
        <span className="text-xs font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
