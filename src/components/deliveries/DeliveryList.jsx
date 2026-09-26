import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { findLocationName } from '../../services/inventoryService';

export default function DeliveryList({
  deliveries = [],
  warehouses = [],
  products = [],
  onSelectDelivery,
  onValidateDelivery,
  onCreateDelivery,
}) {
  if (!deliveries.length) {
    return (
      <EmptyState
        icon="local_shipping"
        title="No delivery orders found"
        description="No outbound deliveries match your current filter criteria."
        actionLabel="Create Delivery Order"
        onAction={onCreateDelivery}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left compact-table border-collapse">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer / Destination</th>
            <th>Dispatch Location</th>
            <th>Items Included</th>
            <th>Status</th>
            <th>Created Date</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {deliveries.map((d) => {
            const locName = findLocationName(warehouses, d.locationId);
            const totalQty = d.items?.reduce((acc, it) => acc + Number(it.quantity), 0) || 0;
            const firstProd = products.find((p) => p.id === d.items?.[0]?.productId);

            return (
              <tr
                key={d.id}
                onClick={() => onSelectDelivery && onSelectDelivery(d)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="font-mono text-xs font-semibold text-slate-900">
                  {d.reference}
                </td>
                <td className="text-xs font-medium text-slate-800">
                  {d.customer}
                </td>
                <td className="text-xs text-slate-600 truncate max-w-[180px]">
                  {locName}
                </td>
                <td className="text-xs text-slate-700">
                  <span className="font-semibold">{totalQty}</span> units across{' '}
                  <span className="text-slate-500">
                    {d.items?.length} SKU(s)
                  </span>
                  {firstProd && (
                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                      {firstProd.name}
                    </span>
                  )}
                </td>
                <td>
                  <Badge dot variant={d.status.toLowerCase()}>
                    {d.status}
                  </Badge>
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(d.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {d.status !== 'Done' && d.status !== 'Canceled' ? (
                    <button
                      type="button"
                      onClick={() => onValidateDelivery && onValidateDelivery(d.id)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      Validate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDelivery && onSelectDelivery(d)}
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
