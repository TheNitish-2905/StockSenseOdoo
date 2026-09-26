import React, { useState, useMemo } from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

export default function StockLedgerTable({ ledger = [] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      if (typeFilter !== 'ALL' && entry.operationType !== typeFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchRef = entry.reference?.toLowerCase().includes(query);
        const matchProd = entry.productName?.toLowerCase().includes(query);
        const matchSku = entry.sku?.toLowerCase().includes(query);
        const matchReason = entry.reason?.toLowerCase().includes(query);
        const matchUser = entry.user?.toLowerCase().includes(query);
        if (!matchRef && !matchProd && !matchSku && !matchReason && !matchUser) {
          return false;
        }
      }
      return true;
    });
  }, [ledger, search, typeFilter]);

  const exportCSV = () => {
    if (!filteredLedger.length) return;
    const headers = [
      'Timestamp',
      'Reference',
      'Operation Type',
      'Product Name',
      'SKU',
      'Source Location',
      'Destination Location',
      'Quantity',
      'Unit',
      'Previous Stock',
      'New Stock',
      'User',
      'Reason',
      'Status',
    ];

    const rows = filteredLedger.map((e) => [
      `"${e.timestamp || ''}"`,
      `"${e.reference || ''}"`,
      `"${e.operationType || ''}"`,
      `"${e.productName || ''}"`,
      `"${e.sku || ''}"`,
      `"${e.sourceLocation || ''}"`,
      `"${e.destLocation || ''}"`,
      e.quantity || 0,
      `"${e.uom || ''}"`,
      e.previousStock ?? '',
      e.newStock ?? '',
      `"${e.user || ''}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 text-left">
      {/* Top Filter and Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search reference, SKU, product, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="ALL">All Operation Types</option>
            <option value="Receipt">Receipts</option>
            <option value="Delivery">Deliveries</option>
            <option value="Transfer">Transfers</option>
            <option value="Adjustment">Adjustments</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {filteredLedger.length} ledger entry(s)
          </span>
          <Button size="sm" variant="secondary" icon="download" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {filteredLedger.length === 0 ? (
        <EmptyState
          icon="history"
          title="No stock ledger entries found"
          description="Try adjusting your search criteria."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left compact-table border-collapse">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Reference</th>
                <th>Operation</th>
                <th>Product / SKU</th>
                <th>Route / Locations</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Balance</th>
                <th>Operator</th>
                <th>Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLedger.map((entry) => {
                const isPositive = Number(entry.quantity) > 0;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="font-mono text-xs font-semibold text-slate-900">
                      {entry.reference}
                    </td>

                    <td>
                      <Badge size="sm" variant={entry.operationType.toLowerCase()}>
                        {entry.operationType}
                      </Badge>
                    </td>

                    <td>
                      <div className="font-semibold text-slate-900 text-xs">
                        {entry.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {entry.sku}
                      </div>
                    </td>

                    <td className="text-xs text-slate-600 max-w-[220px]">
                      <div className="truncate">
                        <span className="text-slate-400">From:</span> {entry.sourceLocation}
                      </div>
                      <div className="truncate text-slate-800">
                        <span className="text-slate-400">To:</span> {entry.destLocation}
                      </div>
                    </td>

                    <td className="text-right font-mono font-bold text-xs whitespace-nowrap">
                      <span
                        className={
                          entry.operationType === 'Transfer'
                            ? 'text-indigo-600'
                            : isPositive
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }
                      >
                        {entry.operationType === 'Transfer'
                          ? `⇋ ${entry.quantity}`
                          : `${isPositive ? '+' : ''}${entry.quantity}`}{' '}
                        {entry.uom}
                      </span>
                    </td>

                    <td className="text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                      {entry.previousStock !== undefined && entry.newStock !== undefined ? (
                        <span>
                          <span className="text-slate-400">{entry.previousStock}</span> →{' '}
                          <span className="font-semibold text-slate-900">{entry.newStock}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="text-xs text-slate-600 whitespace-nowrap">
                      {entry.user}
                    </td>

                    <td className="text-xs text-slate-500 max-w-[180px] truncate" title={entry.reason}>
                      {entry.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
