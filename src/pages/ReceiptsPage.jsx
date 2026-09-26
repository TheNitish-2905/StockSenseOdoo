import React, { useState, useMemo } from 'react';
import ReceiptList from '../components/receipts/ReceiptList';
import CreateReceiptModal from '../components/receipts/CreateReceiptModal';
import ReceiptDetailModal from '../components/receipts/ReceiptDetailModal';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import { useInventory } from '../store/InventoryContext';

export default function ReceiptsPage({
  createModalOpen,
  setCreateModalOpen,
  initialProduct = null,
}) {
  const { receipts, warehouses, products, validateReceipt } = useInventory();

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const tabs = [
    { id: 'ALL', label: 'All Receipts', badge: receipts.length },
    {
      id: 'Draft',
      label: 'Draft',
      badge: receipts.filter((r) => r.status === 'Draft').length,
    },
    {
      id: 'Waiting',
      label: 'Waiting',
      badge: receipts.filter((r) => r.status === 'Waiting').length,
    },
    {
      id: 'Done',
      label: 'Done',
      badge: receipts.filter((r) => r.status === 'Done').length,
    },
  ];

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (activeTab !== 'ALL' && r.status !== activeTab) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = r.reference?.toLowerCase().includes(q);
        const matchSupplier = r.supplier?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        if (!matchRef && !matchSupplier && !matchNotes) return false;
      }
      return true;
    });
  }, [receipts, activeTab, search]);

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
            placeholder="Search reference, vendor, PO number..."
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
          New Inbound Receipt
        </Button>
      </div>

      {/* Receipts Table */}
      <ReceiptList
        receipts={filteredReceipts}
        warehouses={warehouses}
        products={products}
        onSelectReceipt={(r) => setSelectedReceipt(r)}
        onValidateReceipt={(id) => validateReceipt(id)}
        onCreateReceipt={() => setCreateModalOpen(true)}
      />

      {/* Create Modal */}
      <CreateReceiptModal
        isOpen={createModalOpen}
        initialProduct={initialProduct}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Detail Modal */}
      <ReceiptDetailModal
        isOpen={Boolean(selectedReceipt)}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
