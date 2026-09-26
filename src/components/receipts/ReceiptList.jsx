import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { findLocationName } from '../../services/inventoryService';

export default function ReceiptList({
  receipts = [],
  warehouses = [],
  products = [],
  onSelectReceipt,
  onValidateReceipt,
  onCreateReceipt,
}) {
  if (!receipts.length) {
    return (
      <EmptyState
        icon="receipt_long"
        title="No receipts found"
        description="No inbound receipts match your filter criteria."
        actionLabel="Create Receipt"
        onAction={onCreateReceipt}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left compact-table border-collapse">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Supplier</th>
            <th>Receiving Location</th>
            <th>Items Included</th>
            <th>Status</th>
            <th>Created Date</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {receipts.map((r) => {
            const locName = findLocationName(warehouses, r.locationId);
            const totalQty = r.items?.reduce((acc, it) => acc + Number(it.quantity), 0) || 0;
            const firstProd = products.find((p) => p.id === r.items?.[0]?.productId);

            return (
              <tr
                key={r.id}
                onClick={() => onSelectReceipt && onSelectReceipt(r)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="font-mono text-xs font-semibold text-slate-900">
                  {r.reference}
                </td>
                <td className="text-xs font-medium text-slate-800">
                  {r.supplier}
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[180px]">
                  {locName}
                </td>
                <td className="text-xs text-slate-700">
                  <span className="font-semibold">{totalQty}</span> units across{' '}
                  <span className="text-slate-500">
                    {r.items?.length} SKU(s)
                  </span>
                  {firstProd && (
                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                      {firstProd.name}
                    </span>
                  )}
                </td>
                <td>
                  <Badge dot variant={r.status.toLowerCase()}>
                    {r.status}
                  </Badge>
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {r.status !== 'Done' && r.status !== 'Canceled' ? (
                    <button
                      type="button"
                      onClick={() => onValidateReceipt && onValidateReceipt(r.id)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 transition-colors"
                    >
                      Validate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectReceipt && onSelectReceipt(r)}
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
