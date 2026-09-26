import React, { useState, useMemo } from 'react';
import TransferList from '../components/transfers/TransferList';
import CreateTransferModal from '../components/transfers/CreateTransferModal';
import TransferDetailModal from '../components/transfers/TransferDetailModal';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import { useInventory } from '../store/InventoryContext';

export default function TransfersPage({
  createModalOpen,
  setCreateModalOpen,
  initialProduct = null,
}) {
  const { transfers, warehouses, products, validateTransfer } = useInventory();

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const tabs = [
    { id: 'ALL', label: 'All Transfers', badge: transfers.length },
    {
      id: 'Waiting',
      label: 'Scheduled / In Transit',
      badge: transfers.filter((t) => t.status === 'Waiting').length,
    },
    {
      id: 'Done',
      label: 'Completed',
      badge: transfers.filter((t) => t.status === 'Done').length,
    },
  ];

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (activeTab !== 'ALL' && t.status !== activeTab) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = t.reference?.toLowerCase().includes(q);
        const prod = products.find((p) => p.id === t.productId);
        const matchProd = prod?.name?.toLowerCase().includes(q);
        const matchSku = prod?.sku?.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        if (!matchRef && !matchProd && !matchSku && !matchNotes) return false;
      }
      return true;
    });
  }, [transfers, activeTab, search, products]);

  return (
    <div className="space-y-4 text-left">
      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Control bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search transfer ref, product, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <Button
          size="sm"
          variant="primary"
          icon="add"
          onClick={() => setCreateModalOpen(true)}
        >
          New Internal Transfer
        </Button>
      </div>

      {/* Transfers Table */}
      <TransferList
        transfers={filteredTransfers}
        warehouses={warehouses}
        products={products}
        onSelectTransfer={(t) => setSelectedTransfer(t)}
        onValidateTransfer={(id) => validateTransfer(id)}
        onCreateTransfer={() => setCreateModalOpen(true)}
      />

      {/* Create Modal */}
      <CreateTransferModal
        isOpen={createModalOpen}
        initialProduct={initialProduct}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Detail Modal */}
      <TransferDetailModal
        isOpen={Boolean(selectedTransfer)}
        transfer={selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
      />
    </div>
  );
}
