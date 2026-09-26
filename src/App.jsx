import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import { InventoryProvider, useInventory } from './store/InventoryContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import DeliveriesPage from './pages/DeliveriesPage';
import TransfersPage from './pages/TransfersPage';
import AdjustmentsPage from './pages/AdjustmentsPage';
import MoveHistoryPage from './pages/MoveHistoryPage';
import WarehousesPage from './pages/WarehousesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Shared modals
import ProductFormModal from './components/products/ProductFormModal';
import CreateReceiptModal from './components/receipts/CreateReceiptModal';
import CreateDeliveryModal from './components/deliveries/CreateDeliveryModal';
import CreateTransferModal from './components/transfers/CreateTransferModal';
import AdjustStockModal from './components/products/AdjustStockModal';
import ProductDetailModal from './components/products/ProductDetailModal';
import ReceiptDetailModal from './components/receipts/ReceiptDetailModal';
import DeliveryDetailModal from './components/deliveries/DeliveryDetailModal';
import TransferDetailModal from './components/transfers/TransferDetailModal';

function AuthenticatedApp() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [activeWarehouseFilter, setActiveWarehouseFilter] = useState('ALL');

  // Global Quick Action / Shared Modal states
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createReceiptOpen, setCreateReceiptOpen] = useState(false);
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [createTransferOpen, setCreateTransferOpen] = useState(false);
  const [createAdjustmentOpen, setCreateAdjustmentOpen] = useState(false);

  // Preselected product for action modals
  const [actionInitialProduct, setActionInitialProduct] = useState(null);

  // Inspector modals
  const [inspectProduct, setInspectProduct] = useState(null);
  const [inspectReceipt, setInspectReceipt] = useState(null);
  const [inspectDelivery, setInspectDelivery] = useState(null);
  const [inspectTransfer, setInspectTransfer] = useState(null);

  const { receipts, deliveries, transfers, products } = useInventory();

  // Handle clicking an operation from dashboard table
  const handleSelectOperation = (op) => {
    if (op.docType === 'Receipt') {
      const found = receipts.find((r) => r.id === op.id);
      setInspectReceipt(found || op);
    } else if (op.docType === 'Delivery') {
      const found = deliveries.find((d) => d.id === op.id);
      setInspectDelivery(found || op);
    } else if (op.docType === 'Transfer') {
      const found = transfers.find((t) => t.id === op.id);
      setInspectTransfer(found || op);
    } else if (op.docType === 'Adjustment') {
      setCurrentRoute('adjustments');
    }
  };

  const handleViewProduct = (productIdOrProduct) => {
    if (typeof productIdOrProduct === 'object') {
      setInspectProduct(productIdOrProduct);
    } else {
      const found = products.find((p) => p.id === productIdOrProduct);
      if (found) setInspectProduct(found);
    }
  };

  const openOrderStock = (product) => {
    setActionInitialProduct(product);
    setCreateReceiptOpen(true);
  };

  const openTransferStock = (product) => {
    setActionInitialProduct(product);
    setCreateTransferOpen(true);
  };

  // Route titles
  const routeMeta = {
    dashboard: { title: 'Inventory Command Dashboard', subtitle: 'Live overview of current stock levels and operations' },
    products: { title: 'Products Catalog', subtitle: 'Manage product SKUs, units of measure, and reorder levels' },
    receipts: { title: 'Inbound Receipts', subtitle: 'Track incoming deliveries from vendors into storage' },
    deliveries: { title: 'Customer Deliveries', subtitle: 'Pick, pack, and ship inventory to fulfill orders' },
    transfers: { title: 'Internal Facility Transfers', subtitle: 'Relocate items between storage racks and facilities' },
    adjustments: { title: 'Stock Adjustments', subtitle: 'Audit reconciliations and manual count discrepancy records' },
    'move-history': { title: 'Stock Ledger & Move History', subtitle: 'Chronological auditable journal of every movement' },
    warehouses: { title: 'Warehouses & Locations', subtitle: 'Manage distribution hubs, storage racks, and bays' },
    settings: { title: 'System Settings', subtitle: 'Category rules, diagnostics, and sample data management' },
    profile: { title: 'User Profile', subtitle: 'Staff credentials and assigned operational station' },
  };

  const currentMeta = routeMeta[currentRoute] || routeMeta.dashboard;

  return (
    <AppLayout
      currentRoute={currentRoute}
      navigate={setCurrentRoute}
      pageTitle={currentMeta.title}
      pageSubtitle={currentMeta.subtitle}
      activeWarehouseFilter={activeWarehouseFilter}
      setActiveWarehouseFilter={setActiveWarehouseFilter}
      onOpenCreateProduct={() => setCreateProductOpen(true)}
      onOpenCreateReceipt={() => {
        setActionInitialProduct(null);
        setCreateReceiptOpen(true);
      }}
      onOpenCreateDelivery={() => {
        setActionInitialProduct(null);
        setCreateDeliveryOpen(true);
      }}
      onOpenCreateTransfer={() => {
        setActionInitialProduct(null);
        setCreateTransferOpen(true);
      }}
      onOpenCreateAdjustment={() => setCreateAdjustmentOpen(true)}
    >
      {/* Route Switch */}
      {currentRoute === 'dashboard' && (
        <DashboardPage
          navigate={setCurrentRoute}
          onOpenCreateReceipt={() => {
            setActionInitialProduct(null);
            setCreateReceiptOpen(true);
          }}
          onOpenCreateDelivery={() => {
            setActionInitialProduct(null);
            setCreateDeliveryOpen(true);
          }}
          onOpenCreateTransfer={() => {
            setActionInitialProduct(null);
            setCreateTransferOpen(true);
          }}
          onOpenCreateAdjustment={() => setCreateAdjustmentOpen(true)}
          onOpenCreateProduct={() => setCreateProductOpen(true)}
          onSelectOperation={handleSelectOperation}
          onViewProduct={handleViewProduct}
          activeWarehouseFilter={activeWarehouseFilter}
          setActiveWarehouseFilter={setActiveWarehouseFilter}
        />
      )}

      {currentRoute === 'products' && (
        <ProductsPage
          onOpenCreateTransfer={openTransferStock}
          onOpenCreateReceipt={openOrderStock}
        />
      )}

      {currentRoute === 'receipts' && (
        <ReceiptsPage
          createModalOpen={createReceiptOpen}
          setCreateModalOpen={setCreateReceiptOpen}
          initialProduct={actionInitialProduct}
        />
      )}

      {currentRoute === 'deliveries' && (
        <DeliveriesPage
          createModalOpen={createDeliveryOpen}
          setCreateModalOpen={setCreateDeliveryOpen}
          initialProduct={actionInitialProduct}
        />
      )}

      {currentRoute === 'transfers' && (
        <TransfersPage
          createModalOpen={createTransferOpen}
          setCreateModalOpen={setCreateTransferOpen}
          initialProduct={actionInitialProduct}
        />
      )}

      {currentRoute === 'adjustments' && (
        <AdjustmentsPage
          createModalOpen={createAdjustmentOpen}
          setCreateModalOpen={setCreateAdjustmentOpen}
        />
      )}

      {currentRoute === 'move-history' && <MoveHistoryPage />}

      {currentRoute === 'warehouses' && (
        <WarehousesPage onViewProduct={handleViewProduct} />
      )}

      {currentRoute === 'settings' && <SettingsPage />}

      {currentRoute === 'profile' && <ProfilePage />}

      {/* Global Shared Creation Modals */}
      <ProductFormModal
        isOpen={createProductOpen}
        onClose={() => setCreateProductOpen(false)}
      />

      <CreateReceiptModal
        isOpen={createReceiptOpen && currentRoute !== 'receipts'}
        initialProduct={actionInitialProduct}
        onClose={() => setCreateReceiptOpen(false)}
      />

      <CreateDeliveryModal
        isOpen={createDeliveryOpen && currentRoute !== 'deliveries'}
        initialProduct={actionInitialProduct}
        onClose={() => setCreateDeliveryOpen(false)}
      />

      <CreateTransferModal
        isOpen={createTransferOpen && currentRoute !== 'transfers'}
        initialProduct={actionInitialProduct}
        onClose={() => setCreateTransferOpen(false)}
      />

      <AdjustStockModal
        isOpen={createAdjustmentOpen && currentRoute !== 'adjustments'}
        onClose={() => setCreateAdjustmentOpen(false)}
      />

      {/* Global Shared Inspector Modals */}
      <ProductDetailModal
        isOpen={Boolean(inspectProduct)}
        product={inspectProduct}
        onClose={() => setInspectProduct(null)}
        onAdjust={() => setCreateAdjustmentOpen(true)}
        onTransfer={openTransferStock}
      />

      <ReceiptDetailModal
        isOpen={Boolean(inspectReceipt)}
        receipt={inspectReceipt}
        onClose={() => setInspectReceipt(null)}
      />

      <DeliveryDetailModal
        isOpen={Boolean(inspectDelivery)}
        delivery={inspectDelivery}
        onClose={() => setInspectDelivery(null)}
      />

      <TransferDetailModal
        isOpen={Boolean(inspectTransfer)}
        transfer={inspectTransfer}
        onClose={() => setInspectTransfer(null)}
      />
    </AppLayout>
  );
}

function MainRouter() {
  const { isAuthenticated } = useAuth();
  const [authRoute, setAuthRoute] = useState('login'); // 'login' | 'signup' | 'forgot-password'

  if (!isAuthenticated) {
    if (authRoute === 'signup') {
      return <SignUp navigate={setAuthRoute} />;
    }
    if (authRoute === 'forgot-password') {
      return <ForgotPassword navigate={setAuthRoute} />;
    }
    return <Login navigate={setAuthRoute} />;
  }

  return (
    <InventoryProvider>
      <AuthenticatedApp />
    </InventoryProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
