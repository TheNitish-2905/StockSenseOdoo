import React from 'react';
import StockLedgerTable from '../components/ledger/StockLedgerTable';
import { useInventory } from '../store/InventoryContext';

export default function MoveHistoryPage() {
  const { ledger } = useInventory();

  return (
    <div className="space-y-4 text-left">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Stock Ledger / Movement History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable chronological journal of every stock-changing transaction across all warehouses
        </p>
      </div>

      <StockLedgerTable ledger={ledger} />
    </div>
  );
}
