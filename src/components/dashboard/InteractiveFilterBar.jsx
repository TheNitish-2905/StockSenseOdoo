import React, { useState } from 'react';
import Button from '../ui/Button';

export default function InteractiveFilterBar({
  filters,
  onChange,
  onReset,
  warehouses = [],
  categories = [],
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [
    filters.docType !== 'ALL',
    filters.status !== 'ALL',
    filters.warehouseId !== 'ALL',
    filters.category !== 'ALL',
    Boolean(filters.search?.trim()),
  ].filter(Boolean).length;

  const docTypes = [
    { id: 'ALL', label: 'All Types' },
    { id: 'Receipt', label: 'Receipts' },
    { id: 'Delivery', label: 'Deliveries' },
    { id: 'Transfer', label: 'Transfers' },
    { id: 'Adjustment', label: 'Adjustments' },
  ];

  const statuses = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'Draft', label: 'Draft' },
    { id: 'Waiting', label: 'Waiting' },
    { id: 'Ready', label: 'Ready' },
    { id: 'Done', label: 'Done' },
    { id: 'Canceled', label: 'Canceled' },
  ];

  const getWarehouseName = (id) => {
    if (id === 'ALL') return 'All Warehouses';
    const wh = warehouses.find((w) => w.id === id);
    return wh ? wh.name : id;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs text-left mb-6 transition-all">
      {/* Primary Bar: Search, Quick Dropdowns, and Filter Expand Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Search reference, product SKU, partner, location..."
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange('search', '')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Dropdowns Row & Filter Trigger Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Dropdown */}
          <div className="relative">
            <select
              value={filters.docType}
              onChange={(e) => onChange('docType', e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-7 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
              title="Filter by Document Type"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.id === 'ALL' ? 'Doc Type: All' : dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChange('status', e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-7 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
              title="Filter by Status"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id === 'ALL' ? 'Status: All' : s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Dropdown */}
          <div className="relative">
            <select
              value={filters.warehouseId}
              onChange={(e) => onChange('warehouseId', e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-7 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors max-w-[170px] truncate"
              title="Filter by Warehouse"
            >
              <option value="ALL">Warehouse: All</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => onChange('category', e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-7 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
              title="Filter by Category"
            >
              <option value="ALL">Category: All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Dedicated Filter Button with Active Count */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              isExpanded || activeFiltersCount > 0
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isExpanded ? 'tune' : 'filter_alt'}
            </span>
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isExpanded ? 'bg-sky-500 text-white' : 'bg-slate-800 text-white'
              }`}>
                {activeFiltersCount}
              </span>
            )}
            <span className="material-symbols-outlined text-[16px] transition-transform">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Quick-Select Filter Chips Panel */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 animate-fadeIn">
          {/* Document Types Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Document Type:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {docTypes.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => onChange('docType', dt.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    filters.docType === dt.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Status:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange('status', s.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    filters.status === s.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warehouses Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Warehouse / Facility:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange('warehouseId', 'ALL')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                  filters.warehouseId === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Facilities
              </button>
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  type="button"
                  onClick={() => onChange('warehouseId', wh.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    filters.warehouseId === wh.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {wh.name} ({wh.code})
                </button>
              ))}
            </div>
          </div>

          {/* Categories Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Product Category:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange('category', 'ALL')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                  filters.category === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange('category', cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    filters.category === cat
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Pills Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Active:</span>

          {filters.docType !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-medium">
              <span>Type: {filters.docType}</span>
              <button
                type="button"
                onClick={() => onChange('docType', 'ALL')}
                className="hover:text-sky-900"
              >
                ×
              </button>
            </span>
          )}

          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <span>Status: {filters.status}</span>
              <button
                type="button"
                onClick={() => onChange('status', 'ALL')}
                className="hover:text-amber-900"
              >
                ×
              </button>
            </span>
          )}

          {filters.warehouseId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              <span>Facility: {getWarehouseName(filters.warehouseId)}</span>
              <button
                type="button"
                onClick={() => onChange('warehouseId', 'ALL')}
                className="hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}

          {filters.category !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              <span>Category: {filters.category}</span>
              <button
                type="button"
                onClick={() => onChange('category', 'ALL')}
                className="hover:text-purple-900"
              >
                ×
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <span>Search: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => onChange('search', '')}
                className="hover:text-slate-900"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
