import React, { useState } from 'react';
import EmptyState from '../ui/EmptyState';
import { calculateTotalStock, getStockStatus } from '../../services/inventoryService';

export default function ProductList({
  products = [],
  totalCatalogCount = 0,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
  onAddProduct,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  if (!products.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center">
        <EmptyState
          icon="inventory_2"
          title="No products found"
          description="No inventory products matched your filter criteria, or catalog is currently empty."
          actionLabel="Add Product"
          onAction={onAddProduct}
        />
      </div>
    );
  }

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const currentProducts = products.slice(startIndex, endIndex);

  // Helper for category icons
  const getCategoryIcon = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'raw materials':
        return 'layers';
      case 'finished goods':
        return 'chair';
      case 'hardware':
      case 'hardware & fasteners':
        return 'build';
      case 'packaging':
      case 'packaging supplies':
        return 'inventory_2';
      case 'components':
        return 'cable';
      default:
        return 'widgets';
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden transition-all text-left">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse" id="productsInventoryTable">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-4 pl-6 pr-3 w-12 font-medium">#</th>
              <th className="py-4 px-4 font-medium">ID / SKU</th>
              <th className="py-4 px-4 font-medium">Product Name</th>
              <th className="py-4 px-4 font-medium">Date of Purchase</th>
              <th className="py-4 px-4 font-medium">Quantity</th>
              <th className="py-4 px-4 font-medium">Price</th>
              <th className="py-4 px-4 font-medium">Status</th>
              <th className="py-4 px-4 font-medium">Location</th>
              <th className="py-4 pl-4 pr-6 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {currentProducts.map((product, idx) => {
              const rowNumber = String(startIndex + idx + 1).padStart(2, '0');
              const totalStock = calculateTotalStock(product);
              const status = getStockStatus(totalStock, product.reorderLevel);

              // Unit price or valuation
              const unitPrice = product.costPrice || 70;
              const totalPrice = unitPrice * (totalStock > 0 ? totalStock : 1);

              // Location preview
              let locationLabel = 'Main Central Hub';
              if (product.stockByLocation) {
                const locKeys = Object.keys(product.stockByLocation);
                if (locKeys.length > 0) {
                  locationLabel = locKeys[0].replace('LOC-', 'Bay ').replace('-0', '-');
                }
              }

              // Purchase date formatting
              const purchaseDate =
                product.purchaseDate ||
                new Date(
                  product.createdAt || Date.now() - (idx + 1) * 86400000 * 2
                ).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

              return (
                <tr
                  key={product.id}
                  onClick={() => onViewProduct && onViewProduct(product)}
                  className="group hover:bg-blue-50/40 transition-colors cursor-pointer"
                  data-id={product.sku}
                  data-name={product.name}
                  data-status={
                    status.variant === 'success'
                      ? 'healthy'
                      : status.variant === 'warning'
                      ? 'low'
                      : 'out'
                  }
                >
                  {/* # */}
                  <td className="py-4 pl-6 pr-3 font-mono text-slate-400 font-medium">
                    {rowNumber}
                  </td>

                  {/* ID / SKU */}
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60 shadow-2xs">
                      {product.sku}
                    </span>
                  </td>

                  {/* Product Name with iOS icon box */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-2xs group-hover:bg-white group-hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[17px]">
                          {getCategoryIcon(product.category)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Date of Purchase */}
                  <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                    {purchaseDate}
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-4 font-semibold">
                    <span
                      className={`text-sm ${
                        totalStock <= 0
                          ? 'text-rose-600 font-bold'
                          : totalStock <= product.reorderLevel
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-900'
                      }`}
                    >
                      {totalStock.toLocaleString()} {product.uom}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-mono font-semibold text-slate-800 text-sm whitespace-nowrap">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {status.variant === 'success' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                        Healthy
                      </span>
                    )}
                    {status.variant === 'warning' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"></span>
                        Low Stock
                      </span>
                    )}
                    {status.variant === 'error' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]"></span>
                        Out of Stock
                      </span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                    {locationLabel}
                  </td>

                  {/* Action */}
                  <td
                    className="py-4 pl-4 pr-6 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewProduct && onViewProduct(product)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Product{' '}
                        <span className="material-symbols-outlined text-[15px]">
                          arrow_forward
                        </span>
                      </button>

                      {/* Quick adjust & edit icons */}
                      <button
                        type="button"
                        title="Adjust Stock"
                        onClick={() => onAdjustStock && onAdjustStock(product)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">tune</span>
                      </button>
                      <button
                        type="button"
                        title="Edit Product"
                        onClick={() => onEditProduct && onEditProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button
                        type="button"
                        title="Delete Product"
                        onClick={() => onDeleteProduct && onDeleteProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 border-t border-slate-200/60">
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800 font-semibold">{startIndex + 1}–{endIndex}</strong> of{' '}
          <strong className="text-slate-800 font-semibold">{totalCatalogCount || products.length}</strong> products
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
          >
            <span className="material-symbols-outlined text-xs">chevron_left</span> Prev
          </button>

          {Array.from({ length: totalPages || 1 }).map((_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === safePage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
          >
            Next <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
