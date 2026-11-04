/**
 * StockActionModal: Quick Stock In / Stock Out dialog from table or alerts.
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  actionType: 'IN' | 'OUT';
  onSubmit: (sku: string, quantity: number, performer: string, notes: string) => { success: boolean; message: string };
}

export const StockActionModal: React.FC<StockActionModalProps> = ({
  isOpen,
  onClose,
  product,
  actionType,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState('10');
  const [performer, setPerformer] = useState('Warehouse Lead');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      if (actionType === 'IN') {
        const deficit = Math.max(10, product.reorderLevel - product.quantity);
        setQuantity(deficit.toString());
        setNotes('Inbound stock replenishment');
      } else {
        setQuantity(Math.min(5, Math.max(1, product.quantity)).toString());
        setNotes('Outbound dispatch');
      }
    }
    setError('');
  }, [product, actionType, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if (actionType === 'OUT' && product.quantity < qty) {
      setError(`Cannot dispatch ${qty} units. Only ${product.quantity} units are in stock.`);
      return;
    }

    const res = onSubmit(product.sku, qty, performer, notes);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 text-xs text-neutral-800 dark:text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            {actionType === 'IN' ? (
              <ArrowDownToLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowUpFromLine className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {actionType === 'IN' ? 'Stock In (Receive Units)' : 'Stock Out (Dispatch Units)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 mb-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{product.sku}</div>
          <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{product.name}</div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            In Stock: <strong>{product.quantity}</strong> · Price: <strong>{formatINR(product.price)}</strong> · Reorder Lv: {product.reorderLevel}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Quantity to {actionType === 'IN' ? 'Add' : 'Deduct'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Staff Name
            </label>
            <input
              type="text"
              value={performer}
              onChange={(e) => setPerformer(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Transaction Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Replenishment PO or customer dispatch"
              className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 font-medium rounded-lg text-white transition-opacity cursor-pointer ${
                actionType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {actionType === 'IN' ? 'Stock In' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
