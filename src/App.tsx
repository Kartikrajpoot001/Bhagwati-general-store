/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { StockTransactionsView } from './components/StockTransactionsView';
import { AlertsView } from './components/AlertsView';
import { OrdersView } from './components/OrdersView';
import { AnalysisView } from './components/AnalysisView';
import { ProductModal } from './components/ProductModal';
import { StockActionModal } from './components/StockActionModal';
import { productManager, orderProcessor, ReportService } from './services';
import { Product } from './types';
import { StorageService } from './storage/StorageService';
import { ProcessOrderResult } from './services/OrderProcessor';
import { Check, Info } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Data state revision counter to trigger re-renders on service mutations
  const [revision, setRevision] = useState(0);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<'IN' | 'OUT'>('IN');

  // Sync Dark Mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Subscribe to service state changes
  useEffect(() => {
    const unsubProduct = productManager.subscribe(() => setRevision((r) => r + 1));
    const unsubOrder = orderProcessor.subscribe(() => setRevision((r) => r + 1));
    return () => {
      unsubProduct();
      unsubOrder();
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  }, []);

  // Handlers for Products
  const handleOpenAddProduct = () => {
    setSelectedProduct(null);
    setProductModalMode('ADD');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductModalMode('EDIT');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (data: Partial<Product>) => {
    if (productModalMode === 'ADD') {
      const res = productManager.addProduct(data as Product);
      if (res.success) showToast(res.message);
      return res;
    } else {
      const res = productManager.updateProduct(selectedProduct!.sku, data);
      if (res.success) showToast(res.message);
      return res;
    }
  };

  const handleDeleteProduct = (sku: string) => {
    if (window.confirm(`Are you sure you want to delete product ${sku}? (Can be undone via Undo button)`)) {
      const res = productManager.deleteProduct(sku);
      if (res.success) {
        showToast(res.message);
      }
    }
  };

  // Handlers for Stock Modal
  const handleOpenStockModal = (prod: Product, type: 'IN' | 'OUT') => {
    setSelectedProduct(prod);
    setStockModalType(type);
    setIsStockModalOpen(true);
  };

  const handleStockActionSubmit = (
    sku: string,
    quantity: number,
    performer: string,
    notes: string
  ) => {
    let res;
    if (stockModalType === 'IN') {
      res = productManager.stockIn(sku, quantity, performer, notes);
    } else {
      res = productManager.stockOut(sku, quantity, performer, notes);
    }
    if (res.success) {
      showToast(res.message);
    }
    return res;
  };

  // Receive scheduled delivery (+receiveQty) handler
  const handleReceiveDelivery = (sku: string) => {
    const res = productManager.receiveDelivery(sku);
    if (res.success) {
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Undo Handler powered by custom Stack
  const handleUndo = () => {
    const res = productManager.undoLastAction();
    showToast(res.message);
  };

  // Export Store Data to JSON
  const handleExportJSON = () => {
    StorageService.exportJSON(
      productManager.getAllProducts(),
      StorageService.loadTransactions(),
      {
        pending: orderProcessor.getPendingOrders(),
        history: orderProcessor.getOrderHistory(),
      }
    );
    showToast('Exported complete store inventory and order history to JSON.');
  };

  // Reset to Seed
  const handleResetSeed = () => {
    if (
      window.confirm(
        'Reset all store inventory, sales history, and orders to the original Bhagwati General Store dataset (24 products, 24,185 units sold, ₹8,63,755 revenue)?'
      )
    ) {
      productManager.resetToDemo();
      orderProcessor.initializeFromStorage();
      showToast('Inventory reset to Bhagwati General Store initial dataset.');
    }
  };

  // Live computed values from Services
  const dashboardReport = ReportService.generateDashboardReport(productManager);
  const undoStackCount = productManager.getUndoStackSize();
  const undoHistory = productManager.getUndoHistory();
  const recentTransactions = StorageService.loadTransactions();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Header with Top Bar Contract, 8 Navigation Tabs, and Undo Stack */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        undoCount={undoStackCount}
        undoHistory={undoHistory}
        onUndo={handleUndo}
        onExportJSON={handleExportJSON}
        onResetSeed={handleResetSeed}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            report={dashboardReport}
            productManager={productManager}
            recentTransactions={recentTransactions}
            onNavigate={setActiveTab}
            onOpenAddModal={handleOpenAddProduct}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            productManager={productManager}
            onOpenAddModal={handleOpenAddProduct}
            onOpenEditModal={handleOpenEditProduct}
            onOpenStockModal={handleOpenStockModal}
            onDeleteProduct={handleDeleteProduct}
            onReceiveDelivery={handleReceiveDelivery}
            onResetSeed={handleResetSeed}
          />
        )}

        {activeTab === 'transactions' && (
          <StockTransactionsView
            productManager={productManager}
            transactions={recentTransactions}
            onStockActionSuccess={showToast}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            productManager={productManager}
            onOpenStockModal={handleOpenStockModal}
            onReceiveDelivery={handleReceiveDelivery}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orderProcessor={orderProcessor}
            productManager={productManager}
            onOrderProcessed={(res: ProcessOrderResult) => showToast(res.message)}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView
            productManager={productManager}
            onReceiveDelivery={handleReceiveDelivery}
          />
        )}
      </main>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        initialProduct={selectedProduct}
        mode={productModalMode}
      />

      {/* Quick Stock In/Out Modal */}
      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
        actionType={stockModalType}
        onSubmit={handleStockActionSubmit}
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium rounded-xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2">
          <Info className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-white dark:hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Bhagwati General Store</strong> — Inventory &amp; Stock Management
          </div>
          <div className="text-[11px] text-neutral-400">
            ADSA Course Project: Manual TypeScript implementations of HashTable, AVL Tree, Trie, MinHeap, Queue, Stack, and Sorting algorithms.
          </div>
        </div>
      </footer>
    </div>
  );
}
