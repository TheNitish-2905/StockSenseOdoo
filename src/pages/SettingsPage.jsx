import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useInventory } from '../store/InventoryContext';

export default function SettingsPage() {
  const {
    categories,
    addCategory,
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    ledger,
    resetAllData,
  } = useInventory();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [catError, setCatError] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleAddCategory = (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCategoryName.trim()) {
      setCatError('Category name cannot be empty');
      return;
    }
    try {
      addCategory(newCategoryName);
      setNewCategoryName('');
    } catch (err) {
      setCatError(err.message);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          System Settings & Categories
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure classification tags, defaults, and data management
        </p>
      </div>

      {/* Category Management */}
      <Card
        title="Product Categories"
        subtitle="Manage classification labels used across products, catalog filters, and reporting"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. Electrical Components"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                error={catError}
              />
            </div>
            <Button type="submit" variant="primary" icon="add" className="self-start">
              Add Category
            </Button>
          </form>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Configured Categories ({categories.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <div
                    key={cat}
                    className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-800"
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-200/80 px-1.5 py-0.2 rounded-full font-mono">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* System Diagnostics */}
      <Card
        title="System Diagnostics & Database Statistics"
        subtitle="Local persistence status and records count"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Catalog SKUs</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{products.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Inbound Receipts</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{receipts.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Delivery Orders</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{deliveries.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Internal Transfers</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{transfers.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Count Adjustments</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{adjustments.length}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-slate-500">Total Ledger Entries</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{ledger.length}</p>
          </div>
        </div>
      </Card>

      {/* Reset Demo Data */}
      <Card
        title="Demo Environment Data Reset"
        subtitle="Restore initial sample dataset for fresh testing of all inventory flows"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Resetting clears local storage modifications and restores the realistic sample inventory with Steel Rods, Ergonomic Chairs, Birch Panels, Screws, sample receipts, deliveries, and ledger records.
          </p>
          <Button
            size="sm"
            variant="danger"
            icon="restart_alt"
            onClick={() => setResetConfirmOpen(true)}
            className="flex-shrink-0"
          >
            Reset to Sample Data
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetAllData();
          setResetConfirmOpen(false);
        }}
        title="Reset All Inventory Data"
        message="This will reset all products, warehouses, operations, and ledger records back to the default factory demo dataset. Continue?"
        confirmLabel="Reset Data"
        variant="danger"
      />
    </div>
  );
}
