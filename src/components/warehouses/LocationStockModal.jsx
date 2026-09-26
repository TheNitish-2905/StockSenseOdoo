import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getStockAtLocation, getStockStatus } from '../../services/inventoryService';

export default function LocationStockModal({
  isOpen,
  onClose,
  warehouse,
  location,
  products = [],
  onSelectProduct,
}) {
  if (!warehouse || !location) return null;

  const itemsInLocation = [];
  products.forEach((p) => {
    const qty = getStockAtLocation(p, location.id);
    if (qty > 0) {
      itemsInLocation.push({
        product: p,
        quantity: qty,
      });
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${warehouse.name} — ${location.name}`}
      subtitle={`Location Code: ${location.code} • Category: ${location.type}`}
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded border border-slate-200">
          <span className="text-slate-600">Total Products in Rack:</span>
          <span className="font-semibold text-slate-900 font-mono">
            {itemsInLocation.length} distinct item(s)
          </span>
        </div>

        {itemsInLocation.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
            This location is currently empty.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left compact-table border-collapse">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="text-right">Qty in Rack</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {itemsInLocation.map(({ product, quantity }) => {
                  const status = getStockStatus(quantity, product.reorderLevel);
                  return (
                    <tr
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onSelectProduct && onSelectProduct(product);
                      }}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="font-semibold text-slate-900 text-xs">
                        {product.name}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {product.sku}
                      </td>
                      <td className="text-right font-mono font-bold text-xs text-slate-900">
                        {quantity} {product.uom}
                      </td>
                      <td>
                        <Badge size="sm" dot variant={status.variant}>
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
