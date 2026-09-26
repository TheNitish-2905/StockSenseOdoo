import React from 'react';
import Button from '../ui/Button';

export default function FilterBar({
  filters,
  onChange,
  onReset,
  warehouses = [],
  categories = [],
  showCategory = true,
  showDocType = true,
  showStatus = true,
  showWarehouse = true,
  searchPlaceholder = 'Search reference, product, SKU...',
}) {
  const hasActiveFilters =
    filters.search ||
    filters.docType !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.warehouseId !== 'ALL' ||
    filters.category !== 'ALL';

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs mb-4 text-left">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-md pl-8 pr-3 py-2 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {showDocType && (
            <select
              value={filters.docType}
              onChange={(e) => onChange('docType', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="ALL">All Document Types</option>
              <option value="Receipt">Receipts</option>
              <option value="Delivery">Delivery Orders</option>
              <option value="Transfer">Internal Transfers</option>
              <option value="Adjustment">Adjustments</option>
            </select>
          )}

          {showStatus && (
            <select
              value={filters.status}
              onChange={(e) => onChange('status', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Waiting">Waiting</option>
              <option value="Ready">Ready</option>
              <option value="Done">Done</option>
              <option value="Canceled">Canceled</option>
            </select>
          )}

          {showWarehouse && (
            <select
              value={filters.warehouseId}
              onChange={(e) => onChange('warehouseId', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {showCategory && (
            <select
              value={filters.category}
              onChange={(e) => onChange('category', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-2.5 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="subtle"
              icon="clear"
              onClick={onReset}
              className="text-slate-500 hover:text-slate-900"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
