import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';
import { findLocationName, getStockAtLocation } from '../../services/inventoryService';

export default function TransferDetailModal({
  isOpen,
  onClose,
  transfer,
}) {
  const { products, warehouses, validateTransfer } = useInventory();
  const [validating, setValidating] = useState(false);

  if (!transfer) return null;

  const prod = products.find((p) => p.id === transfer.productId);
  const srcLocName = findLocationName(warehouses, transfer.sourceLocationId);
  const dstLocName = findLocationName(warehouses, transfer.destLocationId);

  const availableSourceStock = prod
    ? getStockAtLocation(prod, transfer.sourceLocationId)
    : 0;

  const isShortage = transfer.status !== 'Done' && availableSourceStock < Number(transfer.quantity);

  const handleValidate = async () => {
    setValidating(true);
    try {
      validateTransfer(transfer.id);
      onClose();
    } catch {
      // Handled by ToastContext
    } finally {
      setValidating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Order: ${transfer.reference}`}
      subtitle={`Created on ${new Date(transfer.createdAt).toLocaleString()}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {transfer.status === 'Done' && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Transfer completed & stock relocated
              </span>
            )}
            {isShortage && (
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Source stock is currently insufficient
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose} disabled={validating}>
              Close
            </Button>
            {transfer.status !== 'Done' && transfer.status !== 'Canceled' && (
              <Button
                size="sm"
                variant="primary"
                icon="swap_horiz"
                onClick={handleValidate}
                loading={validating}
                disabled={isShortage}
              >
                Complete Transfer
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-left">
        {/* Transfer Visual Pipeline */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Origin (Source)
              </span>
              <p className="font-semibold text-slate-900 mt-1">
                {srcLocName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Current: {availableSourceStock} {transfer.uom}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center flex-shrink-0 px-2">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {transfer.quantity} {transfer.uom}
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px] mt-1">
                arrow_forward
              </span>
            </div>

            <div className="flex-1 text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Target (Destination)
              </span>
              <p className="font-semibold text-slate-900 mt-1">
                {dstLocName}
              </p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Product SKU
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              {prod?.name || 'Product'} ({prod?.sku})
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Status
            </span>
            <div className="mt-0.5">
              <Badge dot variant={transfer.status.toLowerCase()}>
                {transfer.status}
              </Badge>
            </div>
          </div>

          {transfer.notes && (
            <div className="col-span-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <strong className="text-slate-800">Reason / Notes: </strong>
              {transfer.notes}
            </div>
          )}

          {transfer.validatedBy && (
            <div className="col-span-2 text-xs text-slate-500">
              Completed by <strong className="text-slate-700">{transfer.validatedBy}</strong> on{' '}
              {new Date(transfer.validatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
