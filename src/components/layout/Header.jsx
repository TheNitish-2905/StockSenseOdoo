import React from 'react';
import { useInventory } from '../../store/InventoryContext';
import { useAuth } from '../../store/AuthContext';
import Button from '../ui/Button';

export default function Header({
  pageTitle,
  pageSubtitle,
  onOpenMobileMenu,
  onOpenQuickAction,
  activeWarehouseFilter,
  setActiveWarehouseFilter,
}) {
  const { warehouses } = useInventory();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md"
          aria-label="Open sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="text-left truncate">
          <h1 className="text-base font-semibold text-slate-900 truncate leading-tight">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xs text-slate-500 truncate hidden sm:block mt-0.5">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: Warehouse filter + Quick action */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Active Warehouse Quick Filter */}
        <div className="relative">
          <select
            value={activeWarehouseFilter}
            onChange={(e) => setActiveWarehouseFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-1.5 pl-2.5 pr-7 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800 transition-colors"
            title="Filter by warehouse"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>

        {/* Database Status Indicator */}
        <div
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
          title="PostgreSQL Backend Server Connected on Port 5001"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PostgreSQL API</span>
        </div>

        {/* Global Quick Action button */}
        {onOpenQuickAction && (
          <Button
            size="sm"
            variant="primary"
            icon="add"
            onClick={onOpenQuickAction}
            className="shadow-xs"
          >
            <span className="hidden sm:inline">New Action</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>
    </header>
  );
}
