import React, { useState } from 'react';
import SimplifiedPieDashboard from '../components/dashboard/SimplifiedPieDashboard';
import { useInventory } from '../store/InventoryContext';

export default function DashboardPage({
  navigate,
  activeWarehouseFilter,
  setActiveWarehouseFilter,
}) {
  const {
    kpis,
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    warehouses,
    categories,
  } = useInventory();

  // Dashboard Filters matching specification
  const [filters, setFilters] = useState({
    docType: 'ALL',
    status: 'ALL',
    warehouseId: activeWarehouseFilter || 'ALL',
    category: 'ALL',
  });

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    if (key === 'warehouseId' && setActiveWarehouseFilter) {
      setActiveWarehouseFilter(val);
    }
  };

  const handleFilterReset = () => {
    setFilters({
      docType: 'ALL',
      status: 'ALL',
      warehouseId: 'ALL',
      category: 'ALL',
    });
    if (setActiveWarehouseFilter) {
      setActiveWarehouseFilter('ALL');
    }
  };

  return (
    <div className="py-2 text-left">
      <SimplifiedPieDashboard
        kpis={kpis}
        products={products}
        receipts={receipts}
        deliveries={deliveries}
        transfers={transfers}
        adjustments={adjustments}
        warehouses={warehouses}
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
        onFilterReset={handleFilterReset}
        navigate={navigate}
      />
    </div>
  );
}
