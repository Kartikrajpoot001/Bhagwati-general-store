/**
 * ProductModal: Add or Edit Product modal dialog.
 * Validates SKU, Name, Category, Price, Quantity, Reorder Level, and Expiry Date.
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => { success: boolean; message: string };
  initialProduct?: Product | null;
  mode: 'ADD' | 'EDIT';
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  mode,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('49.99');
  const [quantity, setQuantity] = useState('20');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProduct && mode === 'EDIT') {
      setSku(initialProduct.sku);
      setName(initialProduct.name);
      setCategory(initialProduct.category);
      setPrice(initialProduct.price.toString());
      setQuantity(initialProduct.quantity.toString());
      setReorderLevel(initialProduct.reorderLevel.toString());
      setExpiryDate(initialProduct.expiryDate || '');
    } else {
      setSku(`SKU-GEN-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory('Electronics');
      setPrice('49.99');
      setQuantity('25');
      setReorderLevel('10');
      setExpiryDate('');
    }
    setError('');
  }, [initialProduct, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid positive number.');
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('Quantity must be a valid non-negative integer.');
      return;
    }

    const reorderNum = parseInt(reorderLevel, 10);
    if (isNaN(reorderNum) || reorderNum < 0) {
      setError('Reorder level must be a valid non-negative integer.');
      return;
    }

    const result = onSubmit({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      price: priceNum,
      quantity: qtyNum,
      reorderLevel: reorderNum,
      expiryDate: expiryDate.trim() || undefined,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 text-xs text-neutral-800 dark:text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {mode === 'ADD' ? 'Register New Product' : `Edit Product ${initialProduct?.sku}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Product Code (SKU)
              </label>
              <input
                type="text"
                disabled={mode === 'EDIT'}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-ELEC-104"
                className={`w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 ${
                  mode === 'EDIT' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Electronics, Pharmaceuticals"
                className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Ergonomic Vertical Mouse"
              className="w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Unit Price (₹ INR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Expiry Date (Optional, for FEFO Heap)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full py-1.5 px-2.5 font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
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
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium rounded-lg hover:opacity-90 cursor-pointer"
            >
              {mode === 'ADD' ? 'Save Product' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
