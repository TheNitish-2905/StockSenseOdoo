import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { findLocationName } from '../../services/inventoryService';

export default function AdjustmentList({
  adjustments = [],
  warehouses = [],
  products = [],
  onSelectAdjustment,
  onCreateAdjustment,
}) {
  if (!adjustments.length) {
    return (
      <EmptyState
        icon="tune"
        title="No inventory adjustments found"
        description="No stock cycle count reconciliations have been performed yet."
        actionLabel="New Adjustment"
        onAction={onCreateAdjustment}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left compact-table border-collapse">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Product / SKU</th>
            <th>Location</th>
            <th className="text-right">Previous Qty</th>
            <th className="text-right">Counted Qty</th>
            <th className="text-right">Difference</th>
            <th>Reason</th>
            <th>Adjusted By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {adjustments.map((a) => {
            const prod = products.find((p) => p.id === a.productId);
            const locName = findLocationName(warehouses, a.locationId);
            const isPositive = Number(a.difference) > 0;

            return (
              <tr
                key={a.id}
                onClick={() => onSelectAdjustment && onSelectAdjustment(a)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="font-mono text-xs font-semibold text-slate-900">
                  {a.reference}
                </td>
                <td>
                  <div className="font-semibold text-slate-900 text-xs">
                    {prod?.name || a.productId}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {prod?.sku}
                  </div>
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[170px]">
                  {locName}
                </td>
                <td className="text-right font-mono text-xs text-slate-500">
                  {a.previousQuantity} {a.uom}
                </td>
                <td className="text-right font-mono font-semibold text-xs text-slate-900">
                  {a.countedQuantity} {a.uom}
                </td>
                <td className="text-right font-mono font-bold text-xs">
                  <span
                    className={
                      isPositive
                        ? 'text-emerald-600'
                        : a.difference < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }
                  >
                    {isPositive ? `+${a.difference}` : a.difference} {a.uom}
                  </span>
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[180px]">
                  {a.reason}
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {a.adjustedBy}
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
