import React, { useState, useMemo } from 'react';
import DeliveryList from '../components/deliveries/DeliveryList';
import CreateDeliveryModal from '../components/deliveries/CreateDeliveryModal';
import DeliveryDetailModal from '../components/deliveries/DeliveryDetailModal';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import { useInventory } from '../store/InventoryContext';

export default function DeliveriesPage({
  createModalOpen,
  setCreateModalOpen,
  initialProduct = null,
}) {
  const { deliveries, warehouses, products, validateDelivery } = useInventory();

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const tabs = [
    { id: 'ALL', label: 'All Orders', badge: deliveries.length },
    {
      id: 'Ready',
      label: 'Ready to Ship',
      badge: deliveries.filter((d) => d.status === 'Ready').length,
    },
    {
      id: 'Waiting',
      label: 'Waiting',
      badge: deliveries.filter((d) => d.status === 'Waiting').length,
    },
    {
      id: 'Done',
      label: 'Fulfilled (Done)',
      badge: deliveries.filter((d) => d.status === 'Done').length,
    },
  ];

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (activeTab !== 'ALL' && d.status !== activeTab) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = d.reference?.toLowerCase().includes(q);
        const matchCustomer = d.customer?.toLowerCase().includes(q);
        const matchNotes = d.notes?.toLowerCase().includes(q);
        if (!matchRef && !matchCustomer && !matchNotes) return false;
      }
      return true;
    });
  }, [deliveries, activeTab, search]);

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
            placeholder="Search reference, customer, tracking..."
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
          New Delivery Order
        </Button>
      </div>

      {/* Deliveries Table */}
      <DeliveryList
        deliveries={filteredDeliveries}
        warehouses={warehouses}
        products={products}
        onSelectDelivery={(d) => setSelectedDelivery(d)}
        onValidateDelivery={(id) => validateDelivery(id)}
        onCreateDelivery={() => setCreateModalOpen(true)}
      />

      {/* Create Delivery Modal */}
      <CreateDeliveryModal
        isOpen={createModalOpen}
        initialProduct={initialProduct}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Detail Modal */}
      <DeliveryDetailModal
        isOpen={Boolean(selectedDelivery)}
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
      />
    </div>
  );
}
