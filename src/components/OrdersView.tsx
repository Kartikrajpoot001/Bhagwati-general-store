/**
 * Orders View for StockPulse.
 * Simple, user-friendly multi-item order placement and FIFO dispatch processing.
 * Displays prices and totals in INR (₹) with real-time stock verification.
 */

import React, { useState } from 'react';
import {
  ListOrdered,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderItem } from '../types';
import { OrderProcessor, ProcessOrderResult } from '../services/OrderProcessor';
import { ProductManager } from '../services/ProductManager';
import { formatINR } from '../utils/currency';

interface OrdersViewProps {
  orderProcessor: OrderProcessor;
  productManager: ProductManager;
  onOrderProcessed: (result: ProcessOrderResult) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orderProcessor,
  productManager,
  onOrderProcessed,
}) => {
  const products = productManager.getAllProducts();
  const pendingOrders = orderProcessor.getPendingOrders();
  const orderHistory = orderProcessor.getOrderHistory();

  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [lineItems, setLineItems] = useState<OrderItem[]>([
    { sku: products[0]?.sku || '', quantity: 2 },
  ]);
  const [formError, setFormError] = useState('');
  const [lastResult, setLastResult] = useState<ProcessOrderResult | null>(null);

  // Line item handlers
  const handleAddLineItem = () => {
    if (products.length === 0) return;
    setLineItems([...lineItems, { sku: products[0].sku, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemSku = (index: number, newSku: string) => {
    const updated = [...lineItems];
    updated[index].sku = newSku;
    setLineItems(updated);
  };

  const handleUpdateItemQty = (index: number, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    const updated = [...lineItems];
    updated[index].quantity = isNaN(qty) ? 1 : Math.max(1, qty);
    setLineItems(updated);
  };

  const calculateTotal = () => {
    let sum = 0;
    for (let i = 0; i < lineItems.length; i++) {
      const prod = productManager.searchBySKU(lineItems[i].sku);
      if (prod) {
        sum += prod.price * lineItems[i].quantity;
      }
    }
    return sum;
  };

  const handleEnqueueOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter the customer or business name.');
      return;
    }

    if (lineItems.length === 0) {
      setFormError('Order must contain at least one product.');
      return;
    }

    const res = orderProcessor.placeOrder(customerName, lineItems, productManager);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setCustomerName('');
      setLineItems([{ sku: products[0]?.sku || '', quantity: 1 }]);
    }
  };

  const handleProcessNext = () => {
    const result = orderProcessor.processNextOrder(productManager);
    setLastResult(result);
    onOrderProcessed(result);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Queue Process Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Customer Orders & Dispatch Queue
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Process incoming orders in sequence with automatic inventory checks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessNext}
            disabled={pendingOrders.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
              pendingOrders.length === 0
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 active:scale-95'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Process Next Order</span>
            <span className="font-mono tabular-nums px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/20 text-[11px]">
              {pendingOrders.length} in queue
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Result Notification Banner */}
      {lastResult && lastResult.status !== 'QUEUE_EMPTY' && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            lastResult.status === 'FULFILLED'
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {lastResult.status === 'FULFILLED' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-sm mb-0.5">
                {lastResult.status === 'FULFILLED' ? 'Order Fulfilled & Stock Deducted' : 'Order Rejected Due to Stock Shortage'}
              </div>
              <p>{lastResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Split: Create Multi-Item Order (Left) & Live Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Place Order Form */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
            <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Create Customer Order
            </h2>
          </div>

          <form onSubmit={handleEnqueueOrder} className="space-y-4 text-xs">
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Customer / Store Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex BioLabs Mumbai or Delhi Mart"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs"
                required
              />
            </div>

            {/* Line items array */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <span>Items in Order</span>
                <span className="text-neutral-400">{lineItems.length} product{lineItems.length > 1 ? 's' : ''}</span>
              </div>

              {lineItems.map((item, idx) => {
                const prod = productManager.searchBySKU(item.sku);
                const lineTotal = prod ? prod.price * item.quantity : 0;

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={item.sku}
                        onChange={(e) => handleUpdateItemSku(idx, e.target.value)}
                        className="w-full py-1.5 px-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            {p.name} ({p.sku}) · {formatINR(p.price)}
                          </option>
                        ))}
                      </select>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQty(idx, e.target.value)}
                          className="w-16 py-0.5 px-1.5 font-mono rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        />
                        {prod && (
                          <span className="text-[11px] text-neutral-400">
                            (in stock: {prod.quantity})
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                        {formatINR(lineTotal)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddLineItem}
                className="w-full py-1.5 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
              >
                + Add Another Product
              </button>
            </div>

            {/* Total calculation & Submit */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Total Order Worth</div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatINR(calculateTotal())}
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Enqueue Order
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Pending Orders Queue */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Pending Orders Queue ({pendingOrders.length})
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-medium">Processed in order of arrival</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No orders are waiting in the queue right now. Create a new order on the left!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((ord, idx) => {
                const isHead = idx === 0;

                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isHead
                        ? 'border-neutral-900/60 dark:border-neutral-400 bg-neutral-50/80 dark:bg-neutral-800/80 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {ord.id}
                        </span>
                        {isHead && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                            Next in Line
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-neutral-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                      {ord.customerName}
                    </div>

                    {/* Order line items */}
                    <div className="space-y-1 mb-3">
                      {ord.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 font-mono text-[11px]"
                        >
                          <span>
                            {it.productName || it.sku} ({it.sku})
                          </span>
                          <span>
                            {it.quantity} × {formatINR(it.unitPrice || 0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between font-mono">
                      <span className="text-neutral-500 text-[11px]">Total Order Amount</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
                        {formatINR(ord.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Processed Orders History Ledger */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              Completed & Dispatched Orders
            </h3>
            <p className="text-xs text-neutral-500">History of all processed customer orders and stock deductions</p>
          </div>
          <span className="text-xs font-mono text-neutral-400">{orderHistory.length} total processed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Customer Name</th>
                <th className="py-2.5 px-4">Items Summary</th>
                <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Outcome Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {orderHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No orders have been processed yet. Click &quot;Process Next Order&quot; above to fulfill pending orders.
                  </td>
                </tr>
              ) : (
                orderHistory.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {ord.id}
                    </td>
                    <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium whitespace-nowrap">
                      {ord.customerName}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {ord.items.map((i) => `${i.productName || i.sku} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                      {formatINR(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {ord.status === 'FULFILLED' ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Fulfilled
                        </span>
                      ) : (
                        <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                      {ord.rejectionReason || 'Stock validated and successfully deducted'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
