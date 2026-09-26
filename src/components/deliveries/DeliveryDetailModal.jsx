import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { findLocationName, getStockAtLocation } from '../../services/inventoryService';

export default function DeliveryDetailModal({
  isOpen,
  onClose,
  delivery,
}) {
  const { products, warehouses, validateDelivery } = useInventory();
  const [validating, setValidating] = useState(false);

  if (!delivery) return null;

  // Check if any items exceed current available stock
  let hasInsufficientStock = false;
  if (delivery.status !== 'Done' && delivery.status !== 'Canceled') {
    for (const item of delivery.items || []) {
      const prod = products.find((p) => p.id === item.productId);
      const available = getStockAtLocation(prod, delivery.locationId);
      if (available < Number(item.quantity)) {
        hasInsufficientStock = true;
        break;
      }
    }
  }

  const handleValidate = async () => {
    setValidating(true);
    try {
      validateDelivery(delivery.id);
      onClose();
    } catch {
      // Toast handles error
    } finally {
      setValidating(false);
    }
  };

  const locName = findLocationName(warehouses, delivery.locationId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delivery Order: ${delivery.reference}`}
      subtitle={`Customer dispatch order created on ${new Date(delivery.createdAt).toLocaleString()}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {delivery.status === 'Done' && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Fulfilled & stock deducted
              </span>
            )}
            {hasInsufficientStock && (
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Stock insufficient to validate
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose} disabled={validating}>
              Close
            </Button>
            {delivery.status !== 'Done' && delivery.status !== 'Canceled' && (
              <Button
                size="sm"
                variant="primary"
                icon="local_shipping"
                onClick={handleValidate}
                loading={validating}
                disabled={hasInsufficientStock}
              >
                Validate & Deduct Stock
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-left">
        {/* Header Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Customer / Destination
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              {delivery.customer}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Dispatch Location
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              {locName}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Status
            </span>
            <div className="mt-0.5">
              <Badge dot variant={delivery.status.toLowerCase()}>
                {delivery.status}
              </Badge>
            </div>
          </div>

          {delivery.validatedBy && (
            <div className="col-span-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Fulfilled By
              </span>
              <p className="text-xs text-slate-700 mt-0.5">
                {delivery.validatedBy} on {new Date(delivery.validatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {delivery.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <strong className="text-slate-800">Dispatch Notes: </strong>
            {delivery.notes}
          </div>
        )}

        {/* Line Items Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Items to Dispatch ({delivery.items?.length || 0})
          </h4>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left compact-table border-collapse">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Location Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {delivery.items?.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.productId);
                  const available = prod && delivery.locationId
                    ? getStockAtLocation(prod, delivery.locationId)
                    : 0;
                  const isShort = delivery.status !== 'Done' && available < Number(it.quantity);

                  return (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-900 text-xs">
                        {prod?.name || it.productId}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {prod?.sku || '—'}
                      </td>
                      <td className="text-right font-mono font-bold text-xs text-slate-900">
                        -{it.quantity} {it.uom || prod?.uom}
                      </td>
                      <td className="text-right text-xs">
                        <span
                          className={`font-semibold ${
                            isShort ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {available} {prod?.uom}
                        </span>
                        {isShort && (
                          <span className="block text-[10px] text-rose-500 font-medium">
                            Shortage
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
