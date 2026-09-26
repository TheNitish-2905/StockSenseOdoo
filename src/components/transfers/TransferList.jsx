import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { findLocationName } from '../../services/inventoryService';

export default function TransferList({
  transfers = [],
  warehouses = [],
  products = [],
  onSelectTransfer,
  onValidateTransfer,
  onCreateTransfer,
}) {
  if (!transfers.length) {
    return (
      <EmptyState
        icon="swap_horiz"
        title="No internal transfers found"
        description="No internal stock transfers match your current filter criteria."
        actionLabel="Create Transfer"
        onAction={onCreateTransfer}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left compact-table border-collapse">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Product</th>
            <th>Source Location</th>
            <th>Destination Location</th>
            <th className="text-right">Quantity</th>
            <th>Status</th>
            <th>Date</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {transfers.map((t) => {
            const prod = products.find((p) => p.id === t.productId);
            const srcLoc = findLocationName(warehouses, t.sourceLocationId);
            const dstLoc = findLocationName(warehouses, t.destLocationId);

            return (
              <tr
                key={t.id}
                onClick={() => onSelectTransfer && onSelectTransfer(t)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="font-mono text-xs font-semibold text-slate-900">
                  {t.reference}
                </td>
                <td>
                  <div className="font-semibold text-slate-900 text-xs">
                    {prod?.name || t.productId}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {prod?.sku}
                  </div>
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[170px]">
                  {srcLoc}
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[170px]">
                  {dstLoc}
                </td>
                <td className="text-right font-mono font-bold text-xs text-indigo-600">
                  {t.quantity} {t.uom}
                </td>
                <td>
                  <Badge dot variant={t.status.toLowerCase()}>
                    {t.status}
                  </Badge>
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {t.status !== 'Done' && t.status !== 'Canceled' ? (
                    <button
                      type="button"
                      onClick={() => onValidateTransfer && onValidateTransfer(t.id)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectTransfer && onSelectTransfer(t)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                    >
                      Details
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
