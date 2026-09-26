import React, { useState } from 'react';
import WarehouseList from '../components/warehouses/WarehouseList';
import WarehouseFormModal from '../components/warehouses/WarehouseFormModal';
import LocationFormModal from '../components/warehouses/LocationFormModal';
import LocationStockModal from '../components/warehouses/LocationStockModal';
import { useInventory } from '../store/InventoryContext';

export default function WarehousesPage({ onViewProduct }) {
  const { warehouses, products } = useInventory();

  const [addWarehouseOpen, setAddWarehouseOpen] = useState(false);
  const [selectedWarehouseForLocation, setSelectedWarehouseForLocation] = useState(null);
  const [viewingLocationStock, setViewingLocationStock] = useState(null); // { warehouse, location }

  return (
    <div className="space-y-4 text-left">
      <WarehouseList
        warehouses={warehouses}
        products={products}
        onAddWarehouse={() => setAddWarehouseOpen(true)}
        onAddLocation={(wh) => setSelectedWarehouseForLocation(wh)}
        onViewLocationStock={(wh, loc) => setViewingLocationStock({ warehouse: wh, location: loc })}
      />

      {/* Add Warehouse Modal */}
      <WarehouseFormModal
        isOpen={addWarehouseOpen}
        onClose={() => setAddWarehouseOpen(false)}
      />

      {/* Add Location Modal */}
      <LocationFormModal
        isOpen={Boolean(selectedWarehouseForLocation)}
        warehouse={selectedWarehouseForLocation}
        onClose={() => setSelectedWarehouseForLocation(null)}
      />

      {/* Location Stock Modal */}
      <LocationStockModal
        isOpen={Boolean(viewingLocationStock)}
        warehouse={viewingLocationStock?.warehouse}
        location={viewingLocationStock?.location}
        products={products}
        onClose={() => setViewingLocationStock(null)}
        onSelectProduct={onViewProduct}
      />
    </div>
  );
}
