import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { calculateTotalStock } from '../../services/inventoryService';

export default function LowStockAlertCard({
  products = [],
  onOrderStock,
  onViewProduct,
}) {
  const alertItems = products
    .map((p) => {
      const stock = calculateTotalStock(p);
      return {
        ...p,
        currentStock: stock,
        isOutOfStock: stock <= 0,
        isLowStock: stock > 0 && stock <= p.reorderLevel,
      };
    })
    .filter((p) => p.isOutOfStock || p.isLowStock)
    .sort((a, b) => a.currentStock - b.currentStock);

  return (
    <Card
      title="Stock Attention Required"
      subtitle={`${alertItems.length} items at or below reorder threshold`}
      action={
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Reorder Alert
        </span>
      }
    >
      {alertItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-emerald-500 text-[24px]">check_circle</span>
          <span className="font-medium text-slate-700">All inventory levels are healthy</span>
          <span>No products currently require replenishment.</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto -mx-5 px-5">
          {alertItems.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/60 px-2 rounded-md transition-colors"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onViewProduct && onViewProduct(item.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {item.name}
                  </span>
                  <Badge
                    size="sm"
                    dot
                    variant={item.isOutOfStock ? 'error' : 'warning'}
                  >
                    {item.isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-mono text-slate-400">{item.sku}</span>
                  <span>•</span>
                  <span>
                    Current:{' '}
                    <strong className={item.isOutOfStock ? 'text-rose-600' : 'text-amber-700'}>
                      {item.currentStock} {item.uom}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Min Reorder: {item.reorderLevel} {item.uom}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                icon="add_shopping_cart"
                onClick={() => onOrderStock && onOrderStock(item)}
                className="flex-shrink-0 text-xs"
              >
                Receive
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
