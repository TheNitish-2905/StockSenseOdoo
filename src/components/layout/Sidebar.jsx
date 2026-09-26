import React from 'react';
import { useInventory } from '../../store/InventoryContext';
import { useAuth } from '../../store/AuthContext';

export default function Sidebar({
  currentRoute,
  navigate,
  isOpen,
  onClose,
}) {
  const { kpis } = useInventory();
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        {
          id: 'products',
          label: 'Products',
          icon: 'inventory_2',
          badge: kpis.totalCatalogProducts,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'receipts',
          label: 'Receipts',
          icon: 'receipt_long',
          badge: kpis.pendingReceipts > 0 ? kpis.pendingReceipts : null,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          id: 'deliveries',
          label: 'Delivery Orders',
          icon: 'local_shipping',
          badge: kpis.pendingDeliveries > 0 ? kpis.pendingDeliveries : null,
          badgeColor: 'bg-sky-100 text-sky-800',
        },
        {
          id: 'transfers',
          label: 'Internal Transfers',
          icon: 'swap_horiz',
          badge: kpis.internalTransfersScheduled > 0 ? kpis.internalTransfersScheduled : null,
          badgeColor: 'bg-indigo-100 text-indigo-800',
        },
        {
          id: 'adjustments',
          label: 'Stock Adjustments',
          icon: 'tune',
        },
        {
          id: 'move-history',
          label: 'Move History',
          icon: 'history',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ];

  const handleNavClick = (id) => {
    navigate(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden backdrop-blur-xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-xs">
                S
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                  StockSense
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-1 leading-none">
                  Inventory System
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6 text-left flex-1" aria-label="Sidebar Navigation">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge !== null && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile / Logout bottom bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 transition-colors">
            <button
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-300">
                {user?.avatarInitials || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.role || 'Inventory Manager'}
                </p>
              </div>
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
