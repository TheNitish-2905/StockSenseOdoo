import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { findLocationName } from '../../services/inventoryService';

export default function ReceiptDetailModal({
  isOpen,
  onClose,
  receipt,
}) {
  const { products, warehouses, validateReceipt } = useInventory();
  const [validating, setValidating] = useState(false);

  if (!receipt) return null;

  const handleValidate = async () => {
    setValidating(true);
    try {
      validateReceipt(receipt.id);
      onClose();
    } catch {
      // Error handled by ToastContext
    } finally {
      setValidating(false);
    }
  };

  const locName = findLocationName(warehouses, receipt.locationId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inbound Receipt: ${receipt.reference}`}
      subtitle={`Created on ${new Date(receipt.createdAt).toLocaleString()}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {receipt.status === 'Done' && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Stock has been received & credited
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose} disabled={validating}>
              Close
            </Button>
            {receipt.status !== 'Done' && receipt.status !== 'Canceled' && (
              <Button
                size="sm"
                variant="primary"
                icon="check_circle"
                onClick={handleValidate}
                loading={validating}
              >
                Validate & Increase Stock
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
              Supplier / Source
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              {receipt.supplier}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Receiving Bay
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
              <Badge dot variant={receipt.status.toLowerCase()}>
                {receipt.status}
              </Badge>
            </div>
          </div>

          {receipt.validatedBy && (
            <div className="col-span-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Validated By
              </span>
              <p className="text-xs text-slate-700 mt-0.5">
                {receipt.validatedBy} on {new Date(receipt.validatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {receipt.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <strong className="text-slate-800">Notes: </strong>
            {receipt.notes}
          </div>
        )}

        {/* Line Items Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Items Included ({receipt.items?.length || 0})
          </h4>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left compact-table border-collapse">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {receipt.items?.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.productId);
                  return (
                    <tr key={idx}>
                      <td className="font-semibold text-slate-900 text-xs">
                        {prod?.name || it.productId}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {prod?.sku || '—'}
                      </td>
                      <td className="text-right font-mono font-bold text-xs text-slate-900">
                        +{it.quantity} {it.uom || prod?.uom}
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
