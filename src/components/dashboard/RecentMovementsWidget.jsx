import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function RecentMovementsWidget({ ledger = [], onViewAll }) {
  const latest = ledger.slice(0, 5);

  const formatShortTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <Card
      title="Recent Stock Movements"
      subtitle="Latest chronological transactions in the ledger"
      action={
        onViewAll && (
          <Button size="sm" variant="subtle" onClick={onViewAll}>
            View Ledger
          </Button>
        )
      }
    >
      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto -mx-5 px-5">
        {latest.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No movements logged yet.
          </div>
        ) : (
          latest.map((entry) => {
            const isPositive = Number(entry.quantity) > 0;
            return (
              <div key={entry.id} className="py-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant={entry.operationType.toLowerCase()}>
                      {entry.operationType}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {entry.productName}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold ${entry.operationType === 'Transfer'
                        ? 'text-indigo-600'
                        : isPositive
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                  >
                    {entry.operationType === 'Transfer'
                      ? `⇋ ${entry.quantity} ${entry.uom}`
                      : `${isPositive ? '+' : ''}${entry.quantity} ${entry.uom}`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-500">
                  <div className="truncate">
                    <span className="text-slate-400">Ref:</span> {entry.reference} •{' '}
                    <span className="text-slate-600">{entry.sourceLocation}</span> →{' '}
                    <span className="text-slate-600">{entry.destLocation}</span>
                  </div>
                  <span className="text-slate-400 flex-shrink-0">
                    {formatShortTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
