/**
 * Alerts View for StockPulse.
 * Simple, actionable priority alerts:
 * 1. Items Running Low (restock priority)
 * 2. Expiring Items (FEFO dispatch priority)
 * Powered by high-speed Min-Heaps under the hood with optional technical view.
 */

import React, { useState } from 'react';
import { AlertTriangle, Clock, ArrowDownToLine, ArrowUpFromLine, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import { ProductManager } from '../services/ProductManager';

interface AlertsViewProps {
  productManager: ProductManager;
  onOpenStockModal: (product: Product, type: 'IN' | 'OUT') => void;
  onReceiveDelivery?: (sku: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  productManager,
  onOpenStockModal,
  onReceiveDelivery,
}) => {
  const [activeTab, setActiveTab] = useState<'lowstock' | 'fefo'>('lowstock');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Pull items from MinHeaps
  const lowStockItems = productManager.getLowStockAlerts();
  const fefoItems = productManager.getFEFOAlerts();
  const lowStockHeapArray = productManager.getLowStockHeapArray();
  const fefoHeapArray = productManager.getFEFOHeapArray();

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Inventory Warnings & Priority Dispatch
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Automatically prioritized lists for timely restocking and First-Expired, First-Out (FEFO) shipping.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('lowstock')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lowstock'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Items Running Low ({lowStockItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('fefo')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fefo'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Expiring Soon ({fefoItems.length})</span>
          </button>
        </div>
      </div>

      {/* Friendly Guide Banner */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
            {activeTab === 'lowstock' ? 'How Low-Stock Alerts Work' : 'How Expiry Priority (FEFO) Works'}
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">
            {activeTab === 'lowstock'
              ? 'Products whose current stock is at or below their designated reorder threshold. The most urgent shortages appear first.'
              : 'Products sorted by expiry date so warehouse staff can dispatch older inventory first, minimizing waste and expired products.'}
          </p>
        </div>

        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 shrink-0 cursor-pointer"
        >
          <span>Under the hood</span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Optional Technical Details Inspector */}
      {showTechnicalDetails && (
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
            <strong>Binary Min-Heap Array Representation:</strong>
            <span className="text-[11px] text-neutral-400">Root [0] is guaranteed minimum</span>
          </div>
          <div className="text-[11px] text-neutral-500 overflow-x-auto pb-1">
            {(activeTab === 'lowstock' ? lowStockHeapArray : fefoHeapArray).slice(0, 10).map((p, idx) => (
              <span
                key={p.sku}
                className={`inline-block px-1.5 py-0.5 rounded mr-1.5 my-0.5 border ${
                  idx === 0
                    ? 'border-neutral-900 dark:border-white font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800'
                }`}
              >
                [{idx}]: {p.sku}{' '}
                {activeTab === 'lowstock' ? `(${p.quantity - p.reorderLevel})` : `(${p.expiryDate || 'None'})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Alert Cards Grid */}
      {activeTab === 'lowstock' ? (
        <div className="space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/60 text-neutral-500 text-xs">
              Great news! All products are currently above their safe reorder levels.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((prod, index) => {
                const deficit = prod.reorderLevel - prod.quantity;
                const isCritical = prod.quantity === 0 || prod.quantity <= prod.reorderLevel / 2;

                return (
                  <div
                    key={prod.sku}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {prod.sku}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-400">
                          Priority #{index + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {prod.name}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {prod.brand ? `${prod.brand} · ` : ''}{prod.category}
                      </div>
                    </div>

                    {/* 4 Metrics: In Stock, Reorder At, Days of Cover, Shortage */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs font-mono tabular-nums">
                      <div>
                        <div className="text-[10px] text-neutral-400">In Stock</div>
                        <div className={`font-bold text-sm ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                          {prod.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400">Reorder At</div>
                        <div className="text-neutral-700 dark:text-neutral-300 text-sm">{prod.reorderLevel}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400">Days Cover</div>
                        <div className="text-neutral-800 dark:text-neutral-200 font-bold text-sm">
                          {(prod.quantity / Math.max(0.01, prod.avgDailySales)).toFixed(1)}d
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400">Shortage</div>
                        <div className="text-rose-600 font-bold text-sm">+{deficit}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 gap-2">
                      <span className={`text-[11px] font-semibold ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                        {isCritical ? 'Critical Shortage' : 'Low Stock'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onReceiveDelivery && (
                          <button
                            onClick={() => onReceiveDelivery(prod.sku)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                            title={`Receive delivery of ${prod.receiveQty} units`}
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Receive ({prod.receiveQty})</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenStockModal(prod, 'IN')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <span>Custom +</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {fefoItems.length === 0 ? (
            <div className="p-8 text-center border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/60 text-neutral-500 text-xs">
              No products with expiration dates found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fefoItems.map((prod, index) => {
                const expDate = new Date(prod.expiryDate!);
                const diffMs = expDate.getTime() - now.getTime();
                const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const isExpired = daysRemaining < 0;
                const isExpiringUrgent = daysRemaining >= 0 && daysRemaining <= 30;

                return (
                  <div
                    key={prod.sku}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {prod.sku}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-400">
                          Dispatch Rank #{index + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {prod.name}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5">{prod.category}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs font-mono tabular-nums">
                      <div>
                        <div className="text-[10px] text-neutral-400">Expiry Date</div>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {prod.expiryDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400">Status</div>
                        <div
                          className={`font-bold ${
                            isExpired
                              ? 'text-rose-600'
                              : isExpiringUrgent
                              ? 'text-amber-600'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : `${daysRemaining} days left`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        {prod.quantity} units in batch
                      </span>
                      <button
                        onClick={() => onOpenStockModal(prod, 'OUT')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                        <span>Dispatch First</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
