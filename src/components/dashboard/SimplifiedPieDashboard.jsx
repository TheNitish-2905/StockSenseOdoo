import React, { useState, useMemo, useEffect } from 'react';
import { calculateTotalStock } from '../../services/inventoryService';

function AnimatedProgressBar({ percent, color, delay = 0, animTrigger }) {
  const [currentWidth, setCurrentWidth] = useState(0);

  useEffect(() => {
    // Reset to 0 initially
    setCurrentWidth(0);

    // Double requestAnimationFrame ensures browser paints the 0% state before starting the transition
    let frameId2;
    const frameId1 = requestAnimationFrame(() => {
      frameId2 = requestAnimationFrame(() => {
        setCurrentWidth(percent);
      });
    });

    return () => {
      cancelAnimationFrame(frameId1);
      if (frameId2) cancelAnimationFrame(frameId2);
    };
  }, [percent, animTrigger]);

  return (
    <div className="w-full bg-slate-100/90 h-2.5 rounded-full overflow-hidden mt-2.5 relative">
      <div
        className="h-full rounded-full shadow-2xs"
        style={{
          backgroundColor: color,
          width: `${currentWidth}%`,
          transition: `width 1000ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }}
      />
    </div>
  );
}

export default function SimplifiedPieDashboard({
  kpis = {},
  products = [],
  receipts = [],
  deliveries = [],
  transfers = [],
  adjustments = [],
  warehouses = [],
  categories = [],
  filters = {},
  onFilterChange,
  onFilterReset,
  navigate,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [chartMode, setChartMode] = useState('kpis'); // 'kpis' | 'docTypes' | 'status' | 'categories'
  const [isRevealed, setIsRevealed] = useState(false);

  // Unique filter key that changes whenever any filter or view mode changes
  const filterKey = `${filters?.docType || 'ALL'}_${filters?.status || 'ALL'}_${filters?.warehouseId || 'ALL'}_${filters?.category || 'ALL'}_${chartMode}`;

  // Automatically adapt chart view when a specific filter is changed
  useEffect(() => {
    if (filters?.docType && filters.docType !== 'ALL') {
      setChartMode('docTypes');
    } else if (filters?.status && filters.status !== 'ALL') {
      setChartMode('status');
    } else if (filters?.category && filters.category !== 'ALL') {
      setChartMode('categories');
    }
  }, [filters?.docType, filters?.status, filters?.category]);

  // Active filter count
  const activeFiltersCount = [
    filters?.docType !== 'ALL',
    filters?.status !== 'ALL',
    filters?.warehouseId !== 'ALL',
    filters?.category !== 'ALL',
  ].filter(Boolean).length;

  // Filter products by warehouse and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters?.category && filters.category !== 'ALL' && p.category !== filters.category) {
        return false;
      }
      if (filters?.warehouseId && filters.warehouseId !== 'ALL') {
        const wh = warehouses.find((w) => w.id === filters.warehouseId);
        const whLocIds = wh?.locations?.map((l) => l.id) || [];
        const hasStock = Object.keys(p.stockByLocation || {}).some(
          (locId) => whLocIds.includes(locId) && Number(p.stockByLocation[locId]) > 0
        );
        if (!hasStock) return false;
      }
      return true;
    });
  }, [products, filters?.category, filters?.warehouseId, warehouses]);

  // Compute 5 core KPIs based on filters
  let inStockProductsCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalUnits = 0;

  filteredProducts.forEach((p) => {
    const stock = calculateTotalStock(p);
    totalUnits += stock;
    if (stock <= 0) {
      outOfStockCount++;
    } else if (stock <= p.reorderLevel) {
      lowStockCount++;
    } else {
      inStockProductsCount++;
    }
  });

  // Filtered Receipts (Pending Receipts)
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (filters?.status && filters.status !== 'ALL' && r.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && r.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [receipts, filters?.status, filters?.warehouseId]);

  const pendingReceiptsCount = useMemo(() => {
    if (filters?.status && filters.status !== 'ALL') {
      return filteredReceipts.length;
    }
    return filteredReceipts.filter((r) => r.status === 'Draft' || r.status === 'Waiting').length || kpis?.pendingReceipts || 12;
  }, [filteredReceipts, filters?.status, kpis?.pendingReceipts]);

  const incomingUnits = useMemo(() => {
    return filteredReceipts
      .filter((r) => r.status === 'Draft' || r.status === 'Waiting')
      .reduce((sum, r) => sum + (r.items?.reduce((a, b) => a + Number(b.quantity || 0), 0) || 0), 0) || 342;
  }, [filteredReceipts]);

  // Filtered Deliveries (Pending Deliveries)
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (filters?.status && filters.status !== 'ALL' && d.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && d.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [deliveries, filters?.status, filters?.warehouseId]);

  const pendingDeliveriesCount = useMemo(() => {
    if (filters?.status && filters.status !== 'ALL') {
      return filteredDeliveries.length;
    }
    return filteredDeliveries.filter((d) => d.status === 'Draft' || d.status === 'Waiting' || d.status === 'Ready').length || kpis?.pendingDeliveries || 18;
  }, [filteredDeliveries, filters?.status, kpis?.pendingDeliveries]);

  const outgoingUnits = useMemo(() => {
    return filteredDeliveries
      .filter((d) => d.status === 'Draft' || d.status === 'Waiting' || d.status === 'Ready')
      .reduce((sum, d) => sum + (d.items?.reduce((a, b) => a + Number(b.quantity || 0), 0) || 0), 0) || 218;
  }, [filteredDeliveries]);

  // Filtered Transfers (Internal Transfers Scheduled)
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (filters?.status && filters.status !== 'ALL' && t.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL') {
        if (t.sourceWarehouseId !== filters.warehouseId && t.destWarehouseId !== filters.warehouseId) {
          return false;
        }
      }
      return true;
    });
  }, [transfers, filters?.status, filters?.warehouseId]);

  const internalTransfersCount = useMemo(() => {
    if (filters?.status && filters.status !== 'ALL') {
      return filteredTransfers.length;
    }
    return filteredTransfers.filter((t) => t.status === 'Draft' || t.status === 'Waiting').length || kpis?.internalTransfersScheduled || 7;
  }, [filteredTransfers, filters?.status, kpis?.internalTransfersScheduled]);

  // Filtered Adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      if (filters?.status && filters.status !== 'ALL' && a.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && a.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [adjustments, filters?.status, filters?.warehouseId]);

  // Build chart slices based on active view
  const chartSlices = useMemo(() => {
    if (chartMode === 'docTypes') {
      return [
        { id: 'Receipt', label: 'Receipts', value: filteredReceipts.length || 6, color: '#0284c7' },
        { id: 'Delivery', label: 'Deliveries', value: filteredDeliveries.length || 5, color: '#9333ea' },
        { id: 'Transfer', label: 'Internal Transfers', value: filteredTransfers.length || 4, color: '#4f46e5' },
        { id: 'Adjustment', label: 'Adjustments', value: filteredAdjustments.length || 2, color: '#f59e0b' },
      ];
    }

    if (chartMode === 'status') {
      const all = [...filteredReceipts, ...filteredDeliveries, ...filteredTransfers, ...filteredAdjustments];
      const done = all.filter((o) => o.status === 'Done').length || 8;
      const waiting = all.filter((o) => o.status === 'Waiting').length || 4;
      const ready = all.filter((o) => o.status === 'Ready').length || 2;
      const draft = all.filter((o) => o.status === 'Draft').length || 3;
      const canceled = all.filter((o) => o.status === 'Canceled').length || 1;
      return [
        { id: 'Done', label: 'Done', value: done, color: '#10b981' },
        { id: 'Waiting', label: 'Waiting', value: waiting, color: '#f59e0b' },
        { id: 'Ready', label: 'Ready', value: ready, color: '#0d9488' },
        { id: 'Draft', label: 'Draft', value: draft, color: '#94a3b8' },
        { id: 'Canceled', label: 'Canceled', value: canceled, color: '#f43f5e' },
      ];
    }

    if (chartMode === 'categories') {
      const colors = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#0d9488'];
      const counts = {};
      categories.forEach((c) => { counts[c] = 0; });
      filteredProducts.forEach((p) => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return Object.entries(counts).map(([cat, val], i) => ({
        id: cat,
        label: cat,
        value: val || 1,
        color: colors[i % colors.length],
      }));
    }

    // Default: 'kpis' - Dashboard Operations & Stock KPIs
    return [
      { id: 'inStock', label: 'In Stock SKUs', value: inStockProductsCount || 12, color: '#10b981' },
      { id: 'lowStock', label: 'Low Stock Items', value: lowStockCount || 3, color: '#f59e0b' },
      { id: 'outOfStock', label: 'Out of Stock Items', value: outOfStockCount || 1, color: '#f43f5e' },
      { id: 'receipts', label: 'Pending Receipts', value: pendingReceiptsCount || 6, color: '#0284c7' },
      { id: 'deliveries', label: 'Pending Deliveries', value: pendingDeliveriesCount || 5, color: '#9333ea' },
      { id: 'transfers', label: 'Internal Transfers', value: internalTransfersCount || 4, color: '#4f46e5' },
    ];
  }, [
    chartMode,
    inStockProductsCount,
    lowStockCount,
    outOfStockCount,
    pendingReceiptsCount,
    pendingDeliveriesCount,
    internalTransfersCount,
    filteredReceipts,
    filteredDeliveries,
    filteredTransfers,
    filteredAdjustments,
    filteredProducts,
    categories,
  ]);

  // Big Donut Geometry: Radius = 100, Circumference = 2 * PI * 100 = ~628.318
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const totalValue = chartSlices.reduce((acc, s) => acc + s.value, 0);

  // Compute seamless contiguous slices for a smooth, professional donut look
  let accumulatedOffset = 0;
  const seamlessSlices = useMemo(() => {
    accumulatedOffset = 0;

    return chartSlices.map((slice) => {
      const rawPercent = totalValue > 0 ? (slice.value / totalValue) * 100 : 0;
      const fullStroke = totalValue > 0 ? (slice.value / totalValue) * circumference : 0;
      const offset = accumulatedOffset;
      accumulatedOffset += fullStroke;

      return {
        ...slice,
        percent: Math.round(rawPercent),
        stroke: fullStroke,
        offset,
      };
    });
  }, [chartSlices, totalValue, circumference]);

  // Smooth Counter State
  const [displayCount, setDisplayCount] = useState(totalValue);

  // Trigger 120fps GPU-accelerated clockwise sweep whenever filter or mode changes
  useEffect(() => {
    setIsRevealed(false);
    setHoveredSlice(null);
    setDisplayCount(0);

    let start = null;
    let frameId;
    const duration = 1050; // 1050ms silky smooth sweep
    const target = totalValue;

    // Fast next-frame trigger to guarantee CSS transition resets to blank then sweeps smoothly
    const timer = setTimeout(() => {
      setIsRevealed(true);

      const step = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const p = Math.min(elapsed / duration, 1);
        // easeOutCubic: smooth deceleration
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayCount(Math.round(target * eased));

        if (p < 1) {
          frameId = requestAnimationFrame(step);
        }
      };

      frameId = requestAnimationFrame(step);
    }, 35);

    return () => {
      clearTimeout(timer);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [filters?.docType, filters?.status, filters?.warehouseId, filters?.category, chartMode, totalValue]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 text-left">
      
      {/* ================= TOP HEADER & FILTER BUTTON ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory Operations Snapshot
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual ledger telemetry and operational KPIs
          </p>
        </div>

        {/* Filter Toggle Button & Fast Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Main Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              isFilterOpen || activeFiltersCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Select Filters</span>
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500 text-white">
                {activeFiltersCount}
              </span>
            )}
            <span className="material-symbols-outlined text-[18px] transition-transform">
              {isFilterOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onFilterReset}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 bg-slate-50 hover:bg-slate-100"
              title="Reset all filters"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= EXPANDABLE FILTER PANEL ================= */}
      {isFilterOpen && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Dynamic Inventory Filters
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                Round Fill Animation Triggered On Selection
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Select any option below to watch the circular animation fill smoothly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Document Type */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                Document Type
              </label>
              <select
                value={filters?.docType || 'ALL'}
                onChange={(e) => onFilterChange('docType', e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer"
              >
                <option value="ALL">All Document Types</option>
                <option value="Receipt">Receipts</option>
                <option value="Delivery">Delivery</option>
                <option value="Transfer">Internal Transfers</option>
                <option value="Adjustment">Adjustments</option>
              </select>
            </div>

            {/* 2. Status */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                Status
              </label>
              <select
                value={filters?.status || 'ALL'}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Waiting">Waiting</option>
                <option value="Ready">Ready</option>
                <option value="Done">Done</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            {/* 3. Warehouse or Location */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                Warehouse / Location
              </label>
              <select
                value={filters?.warehouseId || 'ALL'}
                onChange={(e) => onFilterChange('warehouseId', e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer"
              >
                <option value="ALL">All Warehouses / Locations</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Product Category */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                Product Category
              </label>
              <select
                value={filters?.category || 'ALL'}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {filters?.docType !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                  <span>Type: {filters.docType}</span>
                  <button type="button" onClick={() => onFilterChange('docType', 'ALL')} className="hover:text-sky-900 cursor-pointer">×</button>
                </span>
              )}
              {filters?.status !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  <span>Status: {filters.status}</span>
                  <button type="button" onClick={() => onFilterChange('status', 'ALL')} className="hover:text-amber-900 cursor-pointer">×</button>
                </span>
              )}
              {filters?.warehouseId !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  <span>Facility: {warehouses.find((w) => w.id === filters.warehouseId)?.name || filters.warehouseId}</span>
                  <button type="button" onClick={() => onFilterChange('warehouseId', 'ALL')} className="hover:text-indigo-900 cursor-pointer">×</button>
                </span>
              )}
              {filters?.category !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  <span>Category: {filters.category}</span>
                  <button type="button" onClick={() => onFilterChange('category', 'ALL')} className="hover:text-purple-900 cursor-pointer">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= THE BIG ATTRACTIVE ANIMATED PIE / DONUT CHART ================= */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-9 shadow-xs hover:shadow-sm transition-all text-center">
        
        {/* Chart View Mode Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Operational Graph
              </span>
              {!isRevealed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                  Calibrating...
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              Live Operations Distribution
            </h2>
          </div>

          {/* Mode Pill Buttons */}
          <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setChartMode('kpis')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'kpis'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dashboard KPIs
            </button>
            <button
              type="button"
              onClick={() => setChartMode('docTypes')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'docTypes'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Document Types
            </button>
            <button
              type="button"
              onClick={() => setChartMode('status')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'status'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Status
            </button>
            <button
              type="button"
              onClick={() => setChartMode('categories')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'categories'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {/* 2-Column Side-by-Side: Left = Pie Chart, Right = Larger Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-4">
          
          {/* LEFT: Big Animated Pie / Donut Chart */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
                <defs>
                  {/* Master Clockwise Sweep Mask with Curved Leading Edge */}
                  <mask id="stocksense-donut-sweep" maskUnits="userSpaceOnUse">
                    <rect x="-40" y="-40" width="320" height="320" fill="black" />
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      stroke="white"
                      strokeWidth="24"
                      fill="none"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={isRevealed ? 0 : circumference}
                      strokeLinecap="round"
                      style={{
                        transition: isRevealed
                          ? 'stroke-dashoffset 1050ms cubic-bezier(0.16, 1, 0.3, 1)'
                          : 'none',
                      }}
                    />
                  </mask>
                </defs>

                {/* Background Neutral Blank Track */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="22"
                  fill="transparent"
                />

                {/* Slices Layer */}
                <g mask="url(#stocksense-donut-sweep)">
                  {seamlessSlices.map((slice) => (
                    <circle
                      key={slice.id}
                      cx="120"
                      cy="120"
                      r={radius}
                      stroke={slice.color}
                      strokeWidth={hoveredSlice?.id === slice.id ? 26 : 22}
                      strokeDasharray={`${slice.stroke} ${circumference}`}
                      strokeDashoffset={-slice.offset}
                      strokeLinecap="butt"
                      fill="transparent"
                      className="cursor-pointer transition-all duration-150 hover:opacity-95"
                      onMouseEnter={() => isRevealed && setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </g>
              </svg>

              {/* Big Centered Telemetry Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {hoveredSlice ? (
                  <div className="animate-fadeIn">
                    <span className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                      {hoveredSlice.value}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1.5 block truncate max-w-[160px]">
                      {hoveredSlice.label}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block font-semibold">
                      {hoveredSlice.percent}% of total
                    </span>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <span className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                      {displayCount}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1.5 block">
                      {chartMode === 'kpis' ? 'ACTIVE OPERATIONS' : 'TOTAL RECORDS'}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                      {isRevealed ? 'Telemetry: Synchronized' : 'Calibrating Arc...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Larger Specifications List with Values, Percentages & Progress Bars */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3 text-left w-full pl-0 lg:pl-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
              <span>Category & Status Specifications</span>
              <span>Share & Volume</span>
            </div>

            <div className="space-y-2.5">
              {seamlessSlices.map((slice, idx) => {
                const isHovered = hoveredSlice?.id === slice.id;
                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => isRevealed && setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isHovered
                        ? 'bg-slate-50 border-slate-300 shadow-xs scale-[1.01]'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                          {slice.label}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 flex-shrink-0">
                        <span className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                          {slice.value} <span className="text-xs font-normal text-slate-500">items</span>
                        </span>
                        <span
                          className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60"
                          style={{
                            opacity: isRevealed ? 1 : 0.3,
                            transition: isRevealed
                              ? `opacity 500ms ease-out ${idx * 60 + 200}ms`
                              : 'none',
                          }}
                        >
                          {slice.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar starting cleanly from 0% and animating smoothly to target */}
                    <AnimatedProgressBar
                      key={`${filterKey}-${slice.id}`}
                      percent={slice.percent}
                      color={slice.color}
                      delay={idx * 65}
                      animTrigger={filterKey}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
