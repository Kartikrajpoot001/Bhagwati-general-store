/**
 * Stock Transactions View for StockPulse.
 * Simple, intuitive forms for logging Stock In (receipt) and Stock Out (dispatch)
 * with a clean audit ledger history.
 */

import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Search, Filter } from 'lucide-react';
import { Product, StockTransaction } from '../types';
import { ProductManager } from '../services/ProductManager';
import { formatINR } from '../utils/currency';

interface StockTransactionsViewProps {
  productManager: ProductManager;
  transactions: StockTransaction[];
  onStockActionSuccess: (msg: string) => void;
}

export const StockTransactionsView: React.FC<StockTransactionsViewProps> = ({
  productManager,
  transactions,
  onStockActionSuccess,
}) => {
  const products = productManager.getAllProducts();

  // Stock In Form State
  const [inSku, setInSku] = useState(products[0]?.sku || '');
  const [inQty, setInQty] = useState('10');
  const [inPerformer, setInPerformer] = useState('Rahul Sharma (Receiving)');
  const [inNotes, setInNotes] = useState('Supplier shipment batch');
  const [inError, setInError] = useState('');

  // Stock Out Form State
  const [outSku, setOutSku] = useState(products[0]?.sku || '');
  const [outQty, setOutQty] = useState('5');
  const [outPerformer, setOutPerformer] = useState('Priya Patel (Dispatch)');
  const [outNotes, setOutNotes] = useState('Branch store dispatch');
  const [outError, setOutError] = useState('');

  // Table filter states
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedInProduct = productManager.searchBySKU(inSku);
  const selectedOutProduct = productManager.searchBySKU(outSku);

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInError('');
    const qty = parseInt(inQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setInError('Please enter a valid positive quantity.');
      return;
    }
    const res = productManager.stockIn(inSku, qty, inPerformer, inNotes);
    if (!res.success) {
      setInError(res.message);
    } else {
      onStockActionSuccess(res.message);
      setInNotes('');
    }
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOutError('');
    const qty = parseInt(outQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setOutError('Please enter a valid positive quantity.');
      return;
    }
    const res = productManager.stockOut(outSku, qty, outPerformer, outNotes);
    if (!res.success) {
      setOutError(res.message);
    } else {
      onStockActionSuccess(res.message);
      setOutNotes('');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        tx.sku.toLowerCase().includes(q) ||
        tx.productName.toLowerCase().includes(q) ||
        (Boolean(tx.performer) && tx.performer!.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Stock In & Stock Out Operations
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Record items received into the warehouse or dispatched out to customers and branches.
        </p>
      </div>

      {/* 2 Easy Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock In Form */}
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
            <ArrowDownToLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Receive Stock (Stock In)
            </h2>
          </div>

          <form onSubmit={handleStockInSubmit} className="space-y-3.5 text-xs">
            {inError && <div className="text-rose-600 font-medium">{inError}</div>}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Select Product
              </label>
              <select
                value={inSku}
                onChange={(e) => setInSku(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} ({p.sku}) · In Stock: {p.quantity}
                  </option>
                ))}
              </select>
              {selectedInProduct && (
                <div className="mt-1 text-[11px] text-neutral-500">
                  Current Stock: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{selectedInProduct.quantity} units</strong> · Unit Price: {formatINR(selectedInProduct.price)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Quantity Received
                </label>
                <input
                  type="number"
                  min="1"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Received By (Staff Name)
                </label>
                <input
                  type="text"
                  value={inPerformer}
                  onChange={(e) => setInPerformer(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Reference / Notes (Optional)
              </label>
              <input
                type="text"
                value={inNotes}
                onChange={(e) => setInNotes(e.target.value)}
                placeholder="e.g. Supplier delivery slip or restock PO"
                className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Confirm Stock In (Add to Stock)
            </button>
          </form>
        </div>

        {/* Stock Out Form */}
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
            <ArrowUpFromLine className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Dispatch Stock (Stock Out)
            </h2>
          </div>

          <form onSubmit={handleStockOutSubmit} className="space-y-3.5 text-xs">
            {outError && <div className="text-rose-600 font-medium">{outError}</div>}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Select Product
              </label>
              <select
                value={outSku}
                onChange={(e) => setOutSku(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} ({p.sku}) · Available: {p.quantity}
                  </option>
                ))}
              </select>
              {selectedOutProduct && (
                <div className="mt-1 text-[11px] text-neutral-500">
                  Available in stock: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{selectedOutProduct.quantity} units</strong> · Alert level: {selectedOutProduct.reorderLevel}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Quantity to Dispatch
                </label>
                <input
                  type="number"
                  min="1"
                  value={outQty}
                  onChange={(e) => setOutQty(e.target.value)}
                  className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dispatched By (Staff Name)
                </label>
                <input
                  type="text"
                  value={outPerformer}
                  onChange={(e) => setOutPerformer(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Destination / Notes (Optional)
              </label>
              <input
                type="text"
                value={outNotes}
                onChange={(e) => setOutNotes(e.target.value)}
                placeholder="e.g. Dispatched to local retail outlet"
                className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Confirm Stock Out (Deduct from Stock)
            </button>
          </form>
        </div>
      </div>

      {/* Movement Audit Ledger */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs overflow-hidden">
        {/* Filter controls */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              Stock Movement History
            </h3>
            <p className="text-xs text-neutral-500">Complete record of every stock increase, decrease, and adjustment</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by product name, SKU or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs w-60"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs cursor-pointer font-medium"
            >
              <option value="ALL">All Movements</option>
              <option value="STOCK_IN">Stock In (Received)</option>
              <option value="STOCK_OUT">Stock Out (Dispatched)</option>
              <option value="ADJUSTMENT">Adjustments</option>
              <option value="INITIAL">Initial Setup</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Product Code (SKU)</th>
                <th className="py-2.5 px-4">Product Name</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4 text-right">Units Changed</th>
                <th className="py-2.5 px-4">Handled By</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-2.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {tx.sku}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-800 dark:text-neutral-200 font-medium max-w-xs truncate">
                      {tx.productName}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {tx.type === 'STOCK_IN'
                          ? 'Stock In'
                          : tx.type === 'STOCK_OUT'
                          ? 'Stock Out'
                          : tx.type === 'INITIAL'
                          ? 'Setup'
                          : 'Adjustment'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                      tx.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {tx.performer}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 truncate max-w-xs">
                      {tx.notes || '-'}
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
