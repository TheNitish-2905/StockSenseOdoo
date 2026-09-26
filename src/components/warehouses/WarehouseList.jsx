import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getStockAtLocation } from '../../services/inventoryService';

export default function WarehouseList({
  warehouses = [],
  products = [],
  onAddWarehouse,
  onAddLocation,
  onViewLocationStock,
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Storage Facilities & Zones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-warehouse inventory hubs, production floors, and pick racks
          </p>
        </div>
        <Button size="sm" variant="primary" icon="add" onClick={onAddWarehouse}>
          Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {warehouses.map((wh) => {
          // Calculate total physical items stored across this warehouse
          let totalItemsInWh = 0;
          products.forEach((p) => {
            wh.locations.forEach((loc) => {
              totalItemsInWh += getStockAtLocation(p, loc.id);
            });
          });

          return (
            <Card
              key={wh.id}
              title={`${wh.name} (${wh.code})`}
              subtitle={wh.address || 'Operational Distribution Facility'}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  icon="add"
                  onClick={() => onAddLocation && onAddLocation(wh)}
                >
                  Add Rack
                </Button>
              }
              footer={
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Manager: <strong className="text-slate-700">{wh.contactPerson || 'Unassigned'}</strong></span>
                  <span>{wh.locations?.length || 0} rack locations</span>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-600 font-medium">Total Units Stored:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {totalItemsInWh.toLocaleString()} units
                  </span>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Storage Locations ({wh.locations?.length || 0})
                  </h4>

                  <div className="divide-y divide-slate-100 rounded-md border border-slate-200 overflow-hidden">
                    {wh.locations?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No locations configured in this warehouse yet.
                      </div>
                    ) : (
                      wh.locations?.map((loc) => {
                        // Count products stored in this location
                        let locUnits = 0;
                        let distinctSkus = 0;
                        products.forEach((p) => {
                          const stock = getStockAtLocation(p, loc.id);
                          if (stock > 0) {
                            locUnits += stock;
                            distinctSkus++;
                          }
                        });

                        return (
                          <div
                            key={loc.id}
                            className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                <span>{loc.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  [{loc.code}]
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {loc.type}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-mono font-bold text-slate-900 block">
                                  {locUnits.toLocaleString()} units
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {distinctSkus} SKU(s)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => onViewLocationStock && onViewLocationStock(wh, loc)}
                                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-200/60"
                                title="View contents"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
