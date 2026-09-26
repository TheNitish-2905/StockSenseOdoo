import React, { useState } from 'react';
import AdjustmentList from '../components/adjustments/AdjustmentList';
import AdjustStockModal from '../components/products/AdjustStockModal';
import Button from '../components/ui/Button';
import { useInventory } from '../store/InventoryContext';

export default function AdjustmentsPage({
  createModalOpen,
  setCreateModalOpen,
}) {
  const { adjustments, warehouses, products } = useInventory();
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  return (
    <div className="space-y-4 text-left">
      {/* Control bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Inventory Adjustments Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock cycle count audits and inventory corrections
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon="tune"
          onClick={() => setCreateModalOpen(true)}
        >
          New Stock Adjustment
        </Button>
      </div>

      {/* Adjustments Table */}
      <AdjustmentList
        adjustments={adjustments}
        warehouses={warehouses}
        products={products}
        onSelectAdjustment={(a) => setSelectedAdjustment(a)}
        onCreateAdjustment={() => setCreateModalOpen(true)}
      />

      {/* Modal */}
      <AdjustStockModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
