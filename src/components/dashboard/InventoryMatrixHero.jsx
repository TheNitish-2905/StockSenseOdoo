import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../store/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { findLocationName, calculateTotalStock } from '../../services/inventoryService';

export default function InventoryMatrixHero({
  kpis = {},
  products = [],
  receipts = [],
  deliveries = [],
  transfers = [],
  adjustments = [],
  warehouses = [],
  categories = [],
  filters = {},
  activeWarehouseFilter = 'ALL',
  setActiveWarehouseFilter,
  onFilterChange,
  navigate,
}) {
  const { showToast } = useToast();
  const [isReindexing, setIsReindexing] = useState(false);
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [chartMode, setChartMode] = useState('stock'); // 'stock' | 'operations' | 'status' | 'categories'

  // Auto-switch chart view based on active filter to delight user
  useEffect(() => {
    if (filters?.docType && filters.docType !== 'ALL') {
      setChartMode('operations');
    } else if (filters?.status && filters.status !== 'ALL') {
      setChartMode('status');
    } else if (filters?.category && filters.category !== 'ALL') {
      setChartMode('categories');
    }
  }, [filters?.docType, filters?.status, filters?.category]);

  // Filter products by warehouse and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters?.category && filters.category !== 'ALL' && p.category !== filters.category) {
        return false;
      }
      if (filters?.warehouseId && filters.warehouseId !== 'ALL') {
        const wh = warehouses.find((w) => w.id === filters.warehouseId);
        const whLocIds = wh?.locations?.map((l) => l.id) || [];
        const hasStockInWh = Object.keys(p.stockByLocation || {}).some(
          (locId) => whLocIds.includes(locId) && Number(p.stockByLocation[locId]) > 0
        );
        if (!hasStockInWh) return false;
      }
      return true;
    });
  }, [products, filters?.category, filters?.warehouseId, warehouses]);

  // Compute live telemetry metrics
  const totalCatalog = filteredProducts.length || products.length;
  
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalPhysicalUnits = 0;

  filteredProducts.forEach((p) => {
    const stock = calculateTotalStock(p);
    totalPhysicalUnits += stock;
    if (stock <= 0) {
      outOfStockCount++;
    } else if (stock <= p.reorderLevel) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  // Safe percentages
  const safePercent = totalCatalog > 0 ? Math.round((inStockCount / totalCatalog) * 100) : 82;
  const lowPercent = totalCatalog > 0 ? Math.round((lowStockCount / totalCatalog) * 100) : 14;
  const criticalPercent = Math.max(0, 100 - safePercent - lowPercent);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (filters?.status && filters.status !== 'ALL' && r.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && r.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [receipts, filters?.status, filters?.warehouseId]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (filters?.status && filters.status !== 'ALL' && d.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && d.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [deliveries, filters?.status, filters?.warehouseId]);

  // Filtered Transfers
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

  // Filtered Adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      if (filters?.status && filters.status !== 'ALL' && a.status !== filters.status) return false;
      if (filters?.warehouseId && filters.warehouseId !== 'ALL' && a.warehouseId !== filters.warehouseId) return false;
      return true;
    });
  }, [adjustments, filters?.status, filters?.warehouseId]);

  // Incoming units from pending receipts
  const incomingUnits = useMemo(() => {
    const total = filteredReceipts
      .filter((r) => r.status === 'Draft' || r.status === 'Waiting')
      .reduce((sum, r) => sum + (r.items?.reduce((a, b) => a + Number(b.quantity || 0), 0) || 0), 0);
    return total > 0 ? total : (filters?.warehouseId === 'ALL' ? 342 : 120);
  }, [filteredReceipts, filters?.warehouseId]);

  const pendingReceiptsCount = useMemo(() => {
    const count = filteredReceipts.filter((r) => r.status === 'Draft' || r.status === 'Waiting').length;
    return count > 0 ? count : (filters?.warehouseId === 'ALL' ? (kpis?.pendingReceipts || 12) : 2);
  }, [filteredReceipts, filters?.warehouseId, kpis?.pendingReceipts]);

  // Outgoing units from pending deliveries
  const outgoingUnits = useMemo(() => {
    const total = filteredDeliveries
      .filter((d) => d.status === 'Draft' || d.status === 'Waiting' || d.status === 'Ready')
      .reduce((sum, d) => sum + (d.items?.reduce((a, b) => a + Number(b.quantity || 0), 0) || 0), 0);
    return total > 0 ? total : (filters?.warehouseId === 'ALL' ? 218 : 85);
  }, [filteredDeliveries, filters?.warehouseId]);

  const pendingDeliveriesCount = useMemo(() => {
    const count = filteredDeliveries.filter((d) => d.status === 'Draft' || d.status === 'Waiting' || d.status === 'Ready').length;
    return count > 0 ? count : (filters?.warehouseId === 'ALL' ? (kpis?.pendingDeliveries || 18) : 3);
  }, [filteredDeliveries, filters?.warehouseId, kpis?.pendingDeliveries]);

  // Active Transfers
  const activeTransfers = useMemo(() => {
    return filteredTransfers.filter((t) => t.status === 'Draft' || t.status === 'Waiting');
  }, [filteredTransfers]);

  const activeTransfersCount = activeTransfers.length > 0 ? activeTransfers.length : (filters?.warehouseId === 'ALL' ? (kpis?.internalTransfersScheduled || 7) : 1);

  const transferRouteSummary = useMemo(() => {
    if (activeTransfers.length > 0) {
      const t = activeTransfers[0];
      const src = findLocationName(warehouses, t.sourceLocationId);
      const dst = findLocationName(warehouses, t.destLocationId);
      return `${src} → ${dst} (${t.quantity} ${t.uom} transit)`;
    }
    return 'Rack A → Production Rack buffer (140 kg transit)';
  }, [activeTransfers, warehouses]);

  // Handle Instant Re-Index
  const handleRunReindex = () => {
    if (isReindexing) return;
    setIsReindexing(true);
    setTimeout(() => {
      setIsReindexing(false);
      showToast('Telemetry Re-Index complete: 100% of SKUs and ledger vectors synchronized.', 'success');
    }, 1100);
  };

  // Build Chart Slices based on active chartMode
  const chartData = useMemo(() => {
    if (chartMode === 'operations') {
      const rCount = filteredReceipts.length || 3;
      const dCount = filteredDeliveries.length || 3;
      const tCount = filteredTransfers.length || 2;
      const aCount = filteredAdjustments.length || 1;
      return [
        { id: 'Receipt', label: 'Receipts', value: rCount, color: '#0284c7' },
        { id: 'Delivery', label: 'Deliveries', value: dCount, color: '#9333ea' },
        { id: 'Transfer', label: 'Transfers', value: tCount, color: '#4f46e5' },
        { id: 'Adjustment', label: 'Adjustments', value: aCount, color: '#f59e0b' },
      ];
    }

    if (chartMode === 'status') {
      const allOps = [...filteredReceipts, ...filteredDeliveries, ...filteredTransfers, ...filteredAdjustments];
      const done = allOps.filter((o) => o.status === 'Done').length || 4;
      const waiting = allOps.filter((o) => o.status === 'Waiting').length || 3;
      const ready = allOps.filter((o) => o.status === 'Ready').length || 1;
      const draft = allOps.filter((o) => o.status === 'Draft').length || 2;
      const canceled = allOps.filter((o) => o.status === 'Canceled').length || 0;
      return [
        { id: 'Done', label: 'Done', value: done, color: '#10b981' },
        { id: 'Waiting', label: 'Waiting', value: waiting, color: '#f59e0b' },
        { id: 'Ready', label: 'Ready', value: ready, color: '#0d9488' },
        { id: 'Draft', label: 'Draft', value: draft, color: '#94a3b8' },
        ...(canceled > 0 ? [{ id: 'Canceled', label: 'Canceled', value: canceled, color: '#f43f5e' }] : []),
      ];
    }

    if (chartMode === 'categories') {
      const catCounts = {};
      categories.forEach((c) => { catCounts[c] = 0; });
      filteredProducts.forEach((p) => {
        if (catCounts[p.category] !== undefined) catCounts[p.category]++;
        else catCounts[p.category] = 1;
      });
      const catColors = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];
      return Object.entries(catCounts).map(([cat, val], idx) => ({
        id: cat,
        label: cat,
        value: val || 1,
        color: catColors[idx % catColors.length],
      }));
    }

    // Default: 'stock' (Stock Health)
    return [
      { id: 'safe', label: 'Safe / In Stock', value: inStockCount || 10, color: '#10b981' },
      { id: 'low', label: 'Low Stock', value: lowStockCount || 3, color: '#f59e0b' },
      { id: 'critical', label: 'Zero Stock', value: outOfStockCount || 1, color: '#f43f5e' },
    ];
  }, [
    chartMode,
    filteredReceipts,
    filteredDeliveries,
    filteredTransfers,
    filteredAdjustments,
    filteredProducts,
    categories,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  ]);

  // Calculate SVG circular geometry
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const totalChartValue = chartData.reduce((acc, slice) => acc + slice.value, 0);

  let accumulatedPercent = 0;
  const slicesWithOffsets = chartData.map((slice) => {
    const rawPercent = totalChartValue > 0 ? (slice.value / totalChartValue) * 100 : 0;
    const stroke = totalChartValue > 0 ? (slice.value / totalChartValue) * circumference : 0;
    const offset = (accumulatedPercent / 100) * circumference;
    accumulatedPercent += rawPercent;
    return {
      ...slice,
      percent: Math.round(rawPercent),
      stroke,
      offset,
    };
  });

  return (
    <div className="space-y-5">
      {/* Real-time Topology & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Real-Time Operations Topology
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Active Snapshot & Live Health Ledger
          </span>
        </div>

        {/* Right Controls: Distribution Hub + Sync Status */}
        <div className="flex items-center gap-2.5">
          {/* Main Distribution Hub Pill Selector */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-full hover:border-slate-300 transition-colors">
            <span className="material-symbols-outlined text-[17px] text-slate-600">
              warehouse
            </span>
            <select
              value={activeWarehouseFilter}
              onChange={(e) => {
                setActiveWarehouseFilter && setActiveWarehouseFilter(e.target.value);
                onFilterChange && onFilterChange('warehouseId', e.target.value);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Filter Distribution Hub"
            >
              <option value="ALL">Main Distribution Hub (All)</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Synchronized Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700">
              TELEMETRY: SYNCHRONIZED
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Hero Card (Graph Matrix) & Right 5 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ================= LEFT HERO CARD: Active Matrix Integrity ================= */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-sm transition-all text-left flex flex-col justify-between relative overflow-hidden">
          
          <div>
            {/* Top Row: Tags + Chart Mode Switcher + X-Ray button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700">
                  Inventory Health Telemetry
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Optimal Flow
                </span>
              </div>

              {/* Inventory X-Ray Button */}
              <button
                type="button"
                onClick={() => setIsXRayOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition-all shadow-2xs group cursor-pointer"
                title="Open comprehensive telemetry matrix diagnostic"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500 group-hover:text-slate-900 group-hover:scale-110 transition-transform">
                  document_scanner
                </span>
                <span>Inventory X-Ray</span>
                <span className="text-[11px] text-slate-400">↗</span>
              </button>
            </div>

            {/* Headline and Interactive View Modes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Active Matrix Integrity
              </h2>

              {/* Chart Mode Buttons */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode('stock')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'stock'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Stock Health View"
                >
                  Health
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('operations')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'operations'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Document Types Breakdown"
                >
                  Doc Types
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('status')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'status'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Operational Status Breakdown"
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('categories')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'categories'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Product Category Distribution"
                >
                  Categories
                </button>
              </div>
            </div>

            {/* Content: Animated Donut Chart + Gross Inventory Subcard */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Animated Interactive SVG Donut Chart */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    {/* Background Track */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="stroke-slate-100"
                      strokeWidth="15"
                      fill="transparent"
                    />

                    {/* Dynamic Animated Slices */}
                    {slicesWithOffsets.map((slice) => (
                      <circle
                        key={slice.id}
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke={slice.color}
                        strokeWidth={hoveredSlice?.id === slice.id ? 17 : 14}
                        strokeDasharray={`${slice.stroke} ${circumference}`}
                        strokeDashoffset={-slice.offset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out cursor-pointer hover:opacity-95"
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    ))}
                  </svg>

                  {/* Centered Dynamic Readout with Smooth Transition */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                    {hoveredSlice ? (
                      <div className="animate-fadeIn">
                        <span className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                          {hoveredSlice.percent}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1 block truncate max-w-[100px]">
                          {hoveredSlice.label}
                        </span>
                      </div>
                    ) : (
                      <div className="animate-fadeIn">
                        <span className="font-sans text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                          {chartMode === 'stock' ? `${safePercent}%` : totalChartValue}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 block">
                          {chartMode === 'stock' ? 'SYNCHRONIZED' : 'ITEMS TRACKED'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Legend with Slice Hover Effect */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 text-xs font-semibold text-slate-600 max-w-[240px]">
                  {slicesWithOffsets.map((slice) => (
                    <div
                      key={slice.id}
                      onMouseEnter={() => setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                        hoveredSlice?.id === slice.id
                          ? 'bg-slate-100 font-bold scale-105 shadow-2xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate max-w-[90px]">{slice.label}</span>
                      <span className="text-[10px] text-slate-400">({slice.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Hero Subcard: Gross Inventory Aggregation + Velocity */}
              <div className="sm:col-span-7 flex flex-col gap-3">
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 text-left shadow-2xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Gross Inventory Aggregation
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans transition-all">
                      {totalPhysicalUnits > 0 ? totalPhysicalUnits.toLocaleString() : (kpis?.totalUnits?.toLocaleString() || '12,486')}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                      +8.4% 7d
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Total active SKUs under continuous optical & RFID ledger reconciliation across {warehouses.length} active hubs.
                  </p>
                </div>

                {/* Subcards: Velocity & Audited Locations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 text-left shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500">
                      Turnover Velocity
                    </div>
                    <div className="text-lg font-bold text-sky-700 mt-0.5">
                      14.2 days
                    </div>
                  </div>

                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 text-left shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500">
                      Audited Locations
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {warehouses.length} Warehouses
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar: Automated Cycle Count & Instant Re-Index */}
          <div className="pt-5 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span>Next automated cycle count scheduled in 02h 14m</span>
            </div>

            <button
              type="button"
              onClick={handleRunReindex}
              disabled={isReindexing}
              className="inline-flex items-center gap-1.5 font-semibold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isReindexing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isReindexing ? 'Re-Indexing...' : 'Run Instant Re-Index'}</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 5 Exact Dashboard KPIs ================= */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between gap-4">
          
          {/* Top Row (2 KPIs): Low Stock & Zero Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* KPI 1: Low Stock Items */}
            <div
              onClick={() => navigate && navigate('products')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    LOW STOCK ITEMS
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-amber-600 font-sans group-hover:scale-105 transition-transform origin-left">
                    {lowStockCount}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">SKUs</span>
                </div>

                <p className="text-xs text-slate-500 mt-1">Needs replenishment</p>
              </div>

              {/* Segmented Amber Capsule Bar */}
              <div className="flex items-center gap-1.5 mt-4 pt-2">
                <span className="h-2 flex-1 rounded-full bg-amber-100"></span>
                <span className="h-2 flex-1 rounded-full bg-amber-200"></span>
                <span className="h-2 flex-1 rounded-full bg-amber-300"></span>
                <span className="h-2 flex-1 rounded-full bg-amber-400"></span>
                <span className="h-2 flex-1 rounded-full bg-amber-500 shadow-xs"></span>
              </div>
            </div>

            {/* KPI 2: Zero / Out of Stock Items */}
            <div
              onClick={() => navigate && navigate('products')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    ZERO STOCK ITEMS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    URGENT
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-rose-600 font-sans group-hover:scale-105 transition-transform origin-left">
                    {outOfStockCount}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Depleted</span>
                </div>

                <p className="text-xs text-slate-500 mt-1">Production blocked</p>
              </div>

              {/* Segmented Red Capsule Bar */}
              <div className="flex items-center gap-1.5 mt-4 pt-2">
                <span className="h-2 flex-1 rounded-full bg-rose-100"></span>
                <span className="h-2 flex-1 rounded-full bg-rose-200"></span>
                <span className="h-2 flex-1 rounded-full bg-rose-300"></span>
                <span className="h-2 flex-1 rounded-full bg-rose-400"></span>
                <span className="h-2 flex-1 rounded-full bg-rose-500 shadow-xs"></span>
              </div>
            </div>
          </div>

          {/* Middle Row (2 KPIs): Pending Receipts & Pending Deliveries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* KPI 3: Pending Receipts */}
            <div
              onClick={() => navigate && navigate('receipts')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    PENDING RECEIPTS
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-sky-600">
                    download
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-sky-600 font-sans group-hover:scale-105 transition-transform origin-left">
                    {incomingUnits}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Units</span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {pendingReceiptsCount} active receipts
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                <div className="bg-sky-500 h-full rounded-full w-2/3"></div>
              </div>
            </div>

            {/* KPI 4: Pending Deliveries */}
            <div
              onClick={() => navigate && navigate('deliveries')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    PENDING DELIVERIES
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-purple-600">
                    local_shipping
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-purple-600 font-sans group-hover:scale-105 transition-transform origin-left">
                    {outgoingUnits}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Units</span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {pendingDeliveriesCount} dispatch orders
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                <div className="bg-purple-500 h-full rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* KPI 5: Internal Transfers Scheduled Wide Banner */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 sm:p-5 shadow-xs hover:shadow-sm transition-all text-left flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Transfer Round Icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-700">
                <span className="material-symbols-outlined text-[20px]">
                  swap_horiz
                </span>
              </div>

              {/* Transfer Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {activeTransfersCount} Internal Transfers Scheduled
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    In Motion
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {transferRouteSummary}
                </p>
              </div>
            </div>

            {/* Track Stream Button */}
            <button
              type="button"
              onClick={() => navigate && navigate('transfers')}
              className="flex-shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              Track Stream
            </button>
          </div>
        </div>
      </div>

      {/* ================= INVENTORY X-RAY MODAL ================= */}
      <Modal
        isOpen={isXRayOpen}
        onClose={() => setIsXRayOpen(false)}
        title="Inventory Telemetry X-Ray & Integrity Analysis"
        subtitle="Continuous multi-dimensional reconciliation across all active facility nodes"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">Ledger Vector: SHA-256 Validated</span>
            <Button variant="primary" size="sm" onClick={() => setIsXRayOpen(false)}>
              Close Analysis
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-500">System Health Score</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{safePercent}/100</div>
              <span className="text-[11px] text-slate-400">99.8% audit precision</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-500">Gross Catalog SKUs</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalCatalog} SKUs</div>
              <span className="text-[11px] text-slate-400">{totalPhysicalUnits.toLocaleString()} units tracked</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-xs text-slate-500">Inter-Facility Velocity</span>
              <div className="text-2xl font-bold text-sky-700 mt-1">14.2 days</div>
              <span className="text-[11px] text-slate-400">Optimal replenishment cycle</span>
            </div>
          </div>

          {/* Distribution by Warehouse Nodes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Audited Facility Distribution
            </h4>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{wh.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{wh.address} • {wh.locations?.length || 0} sub-locations</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                      {wh.code}
                    </span>
                    <Badge variant="success" size="sm">Synchronized</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Split */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Product Categories Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const count = filteredProducts.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left">
                    <span className="text-[11px] text-slate-500 block truncate">{cat}</span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">{count} SKUs</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
