/**
 * Analysis View for Bhagwati General Store.
 * 1. ABC Revenue Analysis:
 *    - Category A: Top items making up <= 80% revenue (High value, strict control - 8 products)
 *    - Category B: Next items making up <= 95% revenue (Moderate value - 9 products)
 *    - Category C: Remaining items up to 100% revenue (Low value - 7 products)
 * 2. Reorder Recommendation Engine:
 *    - Formula: ceil(avgDailySales * everyDays * 1.5) - current quantity
 *    - Suggests restock buffer units with 1-click delivery receipt
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Package,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ProductManager } from '../services/ProductManager';
import { formatINR } from '../utils/currency';
import { ABCAnalysisResult } from '../types';

interface AnalysisViewProps {
  productManager: ProductManager;
  onReceiveDelivery: (sku: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  productManager,
  onReceiveDelivery,
}) => {
  const [activeTab, setActiveTab] = useState<'abc' | 'reorder'>('abc');
  const [selectedClassFilter, setSelectedClassFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

  const abcData = productManager.getABCAnalysis();
  const totalRevenue = productManager.getTotalRevenue();

  // Summary counts
  let countA = 0;
  let revA = 0;
  let countB = 0;
  let revB = 0;
  let countC = 0;
  let revC = 0;

  for (let i = 0; i < abcData.length; i++) {
    const item = abcData[i];
    if (item.classification === 'A') {
      countA++;
      revA += item.revenue;
    } else if (item.classification === 'B') {
      countB++;
      revB += item.revenue;
    } else {
      countC++;
      revC += item.revenue;
    }
  }

  const pctA = totalRevenue > 0 ? ((revA / totalRevenue) * 100).toFixed(1) : '0';
  const pctB = totalRevenue > 0 ? ((revB / totalRevenue) * 100).toFixed(1) : '0';
  const pctC = totalRevenue > 0 ? ((revC / totalRevenue) * 100).toFixed(1) : '0';

  const filteredAbcData = selectedClassFilter === 'ALL'
    ? abcData
    : abcData.filter((item) => item.classification === selectedClassFilter);

  // Products needing restock under the buffer formula
  const productsNeedingReorder = abcData.filter((item) => item.suggestedOrder > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Inventory Analytics &amp; Optimization
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              O(n log n) Sort
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            ABC revenue prioritization and safety-stock buffer recommendations calculated over 91 days of store data.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('abc')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'abc'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ABC Revenue Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('reorder')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reorder'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reorder Recommendations ({productsNeedingReorder.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'abc' ? (
        <div className="space-y-6">
          {/* ABC 3 Class Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category A Card */}
            <div
              onClick={() => setSelectedClassFilter(selectedClassFilter === 'A' ? 'ALL' : 'A')}
              className={`p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                selectedClassFilter === 'A'
                  ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-neutral-900/60 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Category A — High Value
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                  {pctA}% Revenue
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatINR(revA)}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <strong>{countA} products</strong> generated ~80% of all store turnover. Requires daily stock checks and tight inventory control.
              </p>
            </div>

            {/* Category B Card */}
            <div
              onClick={() => setSelectedClassFilter(selectedClassFilter === 'B' ? 'ALL' : 'B')}
              className={`p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                selectedClassFilter === 'B'
                  ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50/50 dark:bg-sky-950/20'
                  : 'border-sky-200 dark:border-sky-900/50 bg-white dark:bg-neutral-900/60 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Category B — Moderate Value
                </span>
                <span className="text-xs font-mono font-semibold text-sky-800 dark:text-sky-300">
                  {pctB}% Revenue
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatINR(revB)}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <strong>{countB} products</strong> generated next 15% of revenue. Requires periodic weekly review and standard ordering.
              </p>
            </div>

            {/* Category C Card */}
            <div
              onClick={() => setSelectedClassFilter(selectedClassFilter === 'C' ? 'ALL' : 'C')}
              className={`p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                selectedClassFilter === 'C'
                  ? 'ring-2 ring-purple-500 border-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                  : 'border-purple-200 dark:border-purple-900/50 bg-white dark:bg-neutral-900/60 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Category C — Low Value
                </span>
                <span className="text-xs font-mono font-semibold text-purple-800 dark:text-purple-300">
                  {pctC}% Revenue
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatINR(revC)}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <strong>{countC} products</strong> generated final ~5% of sales. Minimal holding cost; simple bulk reordering suffices.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <div className="flex items-center gap-2">
              <span>Showing:</span>
              <button
                onClick={() => setSelectedClassFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedClassFilter === 'ALL'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200'
                }`}
              >
                All 24 Products
              </button>
              <button
                onClick={() => setSelectedClassFilter('A')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedClassFilter === 'A'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Class A ({countA})
              </button>
              <button
                onClick={() => setSelectedClassFilter('B')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedClassFilter === 'B'
                    ? 'bg-sky-700 text-white'
                    : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-100'
                }`}
              >
                Class B ({countB})
              </button>
              <button
                onClick={() => setSelectedClassFilter('C')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedClassFilter === 'C'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                Class C ({countC})
              </button>
            </div>
            <div className="text-[11px] font-mono">
              Total 13-Week Revenue: <strong className="text-neutral-900 dark:text-neutral-100">{formatINR(totalRevenue)}</strong>
            </div>
          </div>

          {/* ABC Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                    <th className="py-3 px-4 text-right">Cumulative Rev (₹)</th>
                    <th className="py-3 px-4 text-right">Cumulative Share</th>
                    <th className="py-3 px-4 text-center">Class</th>
                    <th className="py-3 px-4 text-right">Stock / Reorder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                  {filteredAbcData.map((item, idx) => {
                    const originalRank = abcData.findIndex((x) => x.sku === item.sku) + 1;
                    const badgeColor =
                      item.classification === 'A'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : item.classification === 'B'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';

                    return (
                      <tr
                        key={item.sku}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-neutral-400 tabular-nums">
                          #{originalRank}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 font-sans text-neutral-500 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                          {formatINR(item.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                          {formatINR(item.cumulativeRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300 tabular-nums whitespace-nowrap font-semibold">
                          {item.cumulativePercentage}%
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${badgeColor}`}
                          >
                            Class {item.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                          {item.currentQuantity} / {item.reorderLevel}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Reorder Recommendation View */
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5 flex items-center gap-1.5">
                <span>Buffer Stock Recommendation Formula</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Target Buffer = Math.ceil(avgDailySales × everyDays × 1.5)
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Suggested Order = <code className="text-neutral-800 dark:text-neutral-200 font-semibold font-mono">max(0, Target Buffer - Current Quantity)</code>.
                Calculates the exact replenishment quantity needed to guarantee a 1.5× safety buffer until the next delivery arrives.
              </p>
            </div>
            <div className="shrink-0 font-mono text-[11px] bg-neutral-50 dark:bg-neutral-800 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              {productsNeedingReorder.length} products below target buffer
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right">Daily Sales</th>
                    <th className="py-3 px-4 text-right">Delivery Freq</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-right">Target Buffer</th>
                    <th className="py-3 px-4 text-right">Suggested Order</th>
                    <th className="py-3 px-4 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                  {abcData.map((item) => {
                    const prod = productManager.searchBySKU(item.sku);
                    if (!prod) return null;
                    const targetBuffer = Math.ceil(prod.avgDailySales * prod.everyDays * 1.5);
                    const needsOrder = item.suggestedOrder > 0;

                    return (
                      <tr
                        key={item.sku}
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                          needsOrder ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 font-sans text-neutral-500 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums">
                          <span
                            className={
                              item.currentQuantity <= item.reorderLevel
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }
                          >
                            {item.currentQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                          {prod.avgDailySales.toFixed(2)}/day
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                          Every {prod.everyDays}d
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-500 tabular-nums">
                          {item.reorderLevel}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                          {targetBuffer}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                          {item.suggestedOrder > 0 ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded text-xs">
                              +{item.suggestedOrder} units
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Sufficient
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                          <button
                            onClick={() => onReceiveDelivery(item.sku)}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                            title={`Receive delivery of ${prod.receiveQty} units`}
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Receive ({prod.receiveQty})</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
