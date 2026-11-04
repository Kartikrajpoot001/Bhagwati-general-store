/**
 * Inventory View for StockPulse.
 * Intuitive, user-friendly interface with:
 * - Search by Product Code (SKU)
 * - Autocomplete Search by Name
 * - Price Range Filter (in INR ₹) with quick presets
 * - Clear sort controls (MergeSort, QuickSort, HeapSort)
 * - Add, Edit, Delete, and direct Stock In / Stock Out buttons
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Edit2,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { Product, SortAlgorithm, SortDirection, SortField } from '../types';
import { ProductManager } from '../services/ProductManager';
import { formatINR } from '../utils/currency';

interface InventoryViewProps {
  productManager: ProductManager;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenStockModal: (product: Product, type: 'IN' | 'OUT') => void;
  onDeleteProduct: (sku: string) => void;
  onReceiveDelivery: (sku: string) => void;
  onResetSeed: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  productManager,
  onOpenAddModal,
  onOpenEditModal,
  onOpenStockModal,
  onDeleteProduct,
  onReceiveDelivery,
  onResetSeed,
}) => {
  // Query States
  const [skuQuery, setSkuQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Sorting States
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortAlgo, setSortAlgo] = useState<SortAlgorithm>('mergeSort');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Autocomplete suggestions from Trie
  const autocompleteSuggestions = useMemo(() => {
    if (!nameQuery || nameQuery.trim().length === 0) return [];
    return productManager.getAutocompleteSuggestions(nameQuery, 6);
  }, [nameQuery, productManager]);

  // Categories list
  const categories = useMemo(() => {
    const prods = productManager.getAllProducts();
    const list: string[] = [];
    for (let i = 0; i < prods.length; i++) {
      const cat = prods[i].category;
      let found = false;
      for (let j = 0; j < list.length; j++) {
        if (list[j] === cat) {
          found = true;
          break;
        }
      }
      if (!found && cat) {
        list.push(cat);
      }
    }
    return list;
  }, [productManager]);

  // Filter products using underlying custom data structures
  const { filteredProducts, appliedMethod, sortTelemetry } = useMemo(() => {
    let result: Product[] = [];
    let methodUsed = 'All Products';

    // 1. SKU Search via HashTable O(1)
    if (skuQuery.trim() !== '') {
      const match = productManager.searchBySKU(skuQuery.trim());
      result = match ? [match] : [];
      methodUsed = `Exact SKU Match: "${skuQuery.trim().toUpperCase()}"`;
    }
    // 2. Name Search via Trie Prefix Search
    else if (nameQuery.trim() !== '') {
      result = productManager.searchByNamePrefix(nameQuery.trim());
      methodUsed = `Prefix Name Match: "${nameQuery.trim()}"`;
    }
    // 3. Price Range Query via AVLTree
    else if (minPrice !== '' || maxPrice !== '') {
      const min = minPrice !== '' ? Math.max(0, parseFloat(minPrice)) : 0;
      const max = maxPrice !== '' ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
      result = productManager.filterByPriceRange(min, max);
      methodUsed = `Price Filter: ${formatINR(min, false)} to ${max < 1000000 ? formatINR(max, false) : 'Any'}`;
    }
    // 4. Default: all products
    else {
      result = [...productManager.getAllProducts()];
    }

    // Secondary Category filter
    if (categoryFilter !== 'ALL') {
      const filtered: Product[] = [];
      for (let i = 0; i < result.length; i++) {
        if (result[i].category === categoryFilter) {
          filtered.push(result[i]);
        }
      }
      result = filtered;
    }

    // Apply manual sorting algorithm
    const sorted = productManager.getSortedInventory(sortField, sortAlgo, sortDirection, result);

    return {
      filteredProducts: sorted.sortedList,
      appliedMethod: methodUsed,
      sortTelemetry: sorted.stats,
    };
  }, [
    skuQuery,
    nameQuery,
    minPrice,
    maxPrice,
    categoryFilter,
    sortField,
    sortAlgo,
    sortDirection,
    productManager,
  ]);

  const clearAllFilters = () => {
    setSkuQuery('');
    setNameQuery('');
    setMinPrice('');
    setMaxPrice('');
    setCategoryFilter('ALL');
  };

  const setQuickPriceRange = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
    setSkuQuery('');
    setNameQuery('');
  };

  const hasActiveFilters =
    skuQuery !== '' || nameQuery !== '' || minPrice !== '' || maxPrice !== '' || categoryFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Product Inventory
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            View, search, filter, and manage warehouse products and current stock.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetSeed}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            title="Reset to sample inventory dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs space-y-4">
        {/* Row 1: Search by Name & SKU */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Product Name Autocomplete Search */}
          <div className="md:col-span-5 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Search Name or Brand
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                O(L) Trie
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or brand: 'Britannia', 'Amul', 'Dove'..."
                value={nameQuery}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                onChange={(e) => {
                  setNameQuery(e.target.value);
                  if (e.target.value) setSkuQuery('');
                }}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <Zap className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-2.5" />
              {nameQuery && (
                <button
                  onClick={() => setNameQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-30 p-1.5 space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 px-2 py-0.5">
                    Trie Autocomplete Suggestions:
                  </div>
                  {autocompleteSuggestions.map((item) => (
                    <button
                      key={item.word}
                      onMouseDown={() => {
                        setNameQuery(item.word);
                        setShowAutocomplete(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 capitalize">
                        {item.word}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {item.count} item{item.count > 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SKU Code Search */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Search SKU Code
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                O(1) Hash
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Exact SKU: 'B01', 'M01', 'R05'..."
                value={skuQuery}
                onChange={(e) => {
                  setSkuQuery(e.target.value);
                  if (e.target.value) setNameQuery('');
                }}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <Search className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-2.5" />
              {skuQuery && (
                <button
                  onClick={() => setSkuQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Price Filter (₹ INR) & Quick Range Chips */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <Filter className="w-3 h-3 text-neutral-500" />
              <span>Price Range (₹):</span>
            </span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 py-1 px-2 text-xs font-mono rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 py-1 px-2 text-xs font-mono rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />

            {/* Quick Price Presets */}
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setQuickPriceRange('0', '1000')}
                className="px-2 py-0.5 text-[11px] rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Under ₹1,000
              </button>
              <button
                type="button"
                onClick={() => setQuickPriceRange('1000', '5000')}
                className="px-2 py-0.5 text-[11px] rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                ₹1k - ₹5k
              </button>
              <button
                type="button"
                onClick={() => setQuickPriceRange('5000', '50000')}
                className="px-2 py-0.5 text-[11px] rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                ₹5,000+
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
              <span>Sort by:</span>
            </span>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="py-1 px-2 text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer font-medium"
            >
              <option value="price">Price</option>
              <option value="quantity">Stock Quantity</option>
              <option value="name">Product Name</option>
              <option value="expiry">Expiry Date</option>
              <option value="sku">SKU Code</option>
            </select>

            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="py-1 px-2 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              {sortDirection === 'asc' ? 'Low to High ↑' : 'High to Low ↓'}
            </button>

            {/* Algorithm Choice */}
            <select
              value={sortAlgo}
              onChange={(e) => setSortAlgo(e.target.value as SortAlgorithm)}
              className="py-1 px-2 text-[11px] font-mono rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
              title="Underlying sorting algorithm"
            >
              <option value="mergeSort">MergeSort (Stable)</option>
              <option value="quickSort">QuickSort (In-Place)</option>
              <option value="heapSort">HeapSort (Binary Heap)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="py-1 px-2 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Status / Telemetry strip */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <div>
            <span>Showing: </span>
            <strong className="text-neutral-800 dark:text-neutral-200 font-medium">{appliedMethod}</strong>
            <span> · {filteredProducts.length} items found</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-neutral-400">
            Sorted in {sortTelemetry.executionTimeMs}ms ({sortTelemetry.comparisons} comparisons)
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Brand &amp; Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-center">Batch Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No products found matching your search. Try clearing your filters or adding a new product.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: Product) => {
                  const isLow = p.quantity <= p.reorderLevel;
                  const isCritical = p.quantity === 0 || p.quantity <= p.reorderLevel / 2;

                  return (
                    <tr
                      key={p.sku}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {p.brand ? `${p.brand} · ` : ''}Every {p.everyDays}d delivery
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                        {formatINR(p.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isCritical
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }
                        >
                          {p.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-500 tabular-nums whitespace-nowrap">
                        {p.reorderLevel}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isCritical ? (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold">Critical Shortage</span>
                        ) : isLow ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">Low Stock</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">In Stock</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {/* Prompt-mandated: Receive Delivery button on each row */}
                        <button
                          onClick={() => onReceiveDelivery(p.sku)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                          title={`Receive scheduled delivery of ${p.receiveQty} units`}
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Receive Delivery (+{p.receiveQty})</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Stock In */}
                          <button
                            onClick={() => onOpenStockModal(p, 'IN')}
                            title="Custom Stock In (+ units)"
                            className="p-1.5 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock Out */}
                          <button
                            onClick={() => onOpenStockModal(p, 'OUT')}
                            title="Dispatch Stock (- units)"
                            className="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenEditModal(p)}
                            title="Edit Product Details"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteProduct(p.sku)}
                            title="Delete Product"
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
