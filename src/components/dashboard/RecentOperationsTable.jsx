import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

export default function RecentOperationsTable({
  operations = [],
  onSelectOperation,
  onViewAll,
}) {
  if (!operations.length) {
    return (
      <EmptyState
        icon="sync"
        title="No matching operations"
        description="Try adjusting your filters or record a new receipt, delivery, or transfer."
      />
    );
  }

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left compact-table border-collapse">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Type</th>
            <th>Entity / Partner</th>
            <th>Quantity</th>
            <th>Warehouse / Location</th>
            <th>Status</th>
            <th>Date</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {operations.map((op) => (
            <tr
              key={`${op.docType}-${op.id}`}
              onClick={() => onSelectOperation && onSelectOperation(op)}
              className="cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <td className="font-semibold text-slate-900 font-mono text-xs">
                {op.reference}
              </td>
              <td>
                <Badge variant={op.docType.toLowerCase()}>{op.docType}</Badge>
              </td>
              <td className="max-w-[180px] truncate text-slate-800">
                {op.partner || op.productName || '—'}
              </td>
              <td className="font-medium text-slate-900">
                {op.quantityDisplay || `${op.quantity || op.itemsCount || 1}`}
              </td>
              <td className="text-xs text-slate-500 max-w-[160px] truncate">
                {op.locationName || 'Main Hub'}
              </td>
              <td>
                <Badge dot variant={op.status.toLowerCase()}>
                  {op.status}
                </Badge>
              </td>
              <td className="text-xs text-slate-500 whitespace-nowrap">
                {formatShortDate(op.createdAt)}
              </td>
              <td className="text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectOperation) onSelectOperation(op);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 inline-flex items-center gap-1"
                >
                  View
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
