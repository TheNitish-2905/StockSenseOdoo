import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function AppLayout({
  currentRoute,
  navigate,
  pageTitle,
  pageSubtitle,
  activeWarehouseFilter,
  setActiveWarehouseFilter,
  onOpenCreateProduct,
  onOpenCreateReceipt,
  onOpenCreateDelivery,
  onOpenCreateTransfer,
  onOpenCreateAdjustment,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);

  const handleQuickAction = (actionFn) => {
    setQuickActionModalOpen(false);
    if (actionFn) actionFn();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        navigate={navigate}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickAction={() => setQuickActionModalOpen(true)}
          activeWarehouseFilter={activeWarehouseFilter}
          setActiveWarehouseFilter={setActiveWarehouseFilter}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        title="Quick Inventory Action"
        subtitle="Select an operation to perform"
        size="md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleQuickAction(onOpenCreateReceipt)}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">New Receipt</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Receive incoming vendor stock into a warehouse</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction(onOpenCreateDelivery)}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">New Delivery Order</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pick, pack, and deliver items to a customer</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction(onOpenCreateTransfer)}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Internal Transfer</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Move items between racks or facilities</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction(onOpenCreateAdjustment)}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-slate-500 hover:bg-slate-50 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Inventory Adjustment</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Correct counts from physical audits</div>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction(onOpenCreateProduct)}
            className="sm:col-span-2 flex items-start gap-3 p-3.5 rounded-lg border border-dashed border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Add New Product to Catalog</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Register a new SKU, category, UoM, and reorder threshold</div>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
