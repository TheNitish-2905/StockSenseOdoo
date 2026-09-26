import React from 'react';
import Card from '../ui/Card';

export default function KpiGrid({ kpis, onKpiClick }) {
  const cards = [
    {
      id: 'products',
      title: 'Total In-Stock SKUs',
      value: kpis.totalProductsInStock,
      totalCatalog: kpis.totalCatalogProducts,
      subtext: `${kpis.totalUnits.toLocaleString()} total physical units in system`,
      icon: 'inventory_2',
      color: 'text-slate-900',
      badge: 'Active Catalog',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'low-stock',
      title: 'Low Stock Items',
      value: kpis.lowStockItems,
      subtext: 'Products approaching or at reorder point',
      icon: 'warning',
      color: kpis.lowStockItems > 0 ? 'text-amber-600' : 'text-slate-900',
      badge: kpis.lowStockItems > 0 ? 'Action Needed' : 'Nominal',
      badgeColor: kpis.lowStockItems > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'out-of-stock',
      title: 'Out of Stock Items',
      value: kpis.outOfStockItems,
      subtext: 'Zero available units in inventory',
      icon: 'error',
      color: kpis.outOfStockItems > 0 ? 'text-rose-600' : 'text-slate-900',
      badge: kpis.outOfStockItems > 0 ? 'Depleted' : 'All Stocked',
      badgeColor: kpis.outOfStockItems > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'receipts',
      title: 'Pending Receipts',
      value: kpis.pendingReceipts,
      subtext: 'Inbound vendor shipments to receive',
      icon: 'receipt_long',
      color: 'text-sky-700',
      badge: 'Inbound',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'deliveries',
      title: 'Pending Deliveries',
      value: kpis.pendingDeliveries,
      subtext: 'Customer dispatch orders queued',
      icon: 'local_shipping',
      color: 'text-purple-700',
      badge: 'Outbound',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'transfers',
      title: 'Transfers Scheduled',
      value: kpis.internalTransfersScheduled,
      subtext: 'Inter-facility movements in transit',
      icon: 'swap_horiz',
      color: 'text-indigo-700',
      badge: 'Internal',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div
          key={c.id}
          onClick={() => onKpiClick && onKpiClick(c.id)}
          className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer text-left flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">{c.title}</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeColor}`}
            >
              {c.badge}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className={`text-2xl font-bold tracking-tight ${c.color}`}>
              {c.value}
            </span>
            {c.totalCatalog && (
              <span className="text-xs text-slate-400">/ {c.totalCatalog} SKUs</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              {c.icon}
            </span>
            <span className="truncate">{c.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
