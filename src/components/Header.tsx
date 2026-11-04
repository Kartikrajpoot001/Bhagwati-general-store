/**
 * Top Navigation Header for Bhagwati General Store.
 * Conforms to the 3-zone Top Bar Contract:
 * Zone 1: Brand Wordmark ("Bhagwati General Store")
 * Zone 2: Navigation Links (Dashboard, Inventory, Transactions, Alerts, Orders, ABC Analysis, DS Visualizer, Benchmark)
 * Zone 3: Primary Undo action (powered by Stack), Export JSON, Reset Demo, and Dark mode toggle.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Moon,
  Sun,
  History,
  ChevronDown,
  Download,
  Menu,
  X,
  Store,
  BarChart3,
  ArrowDownToLine,
  ListOrdered,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { UndoAction } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'transactions'
  | 'alerts'
  | 'orders'
  | 'analysis';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  undoCount: number;
  undoHistory: UndoAction[];
  onUndo: () => void;
  onExportJSON: () => void;
  onResetSeed: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  undoCount,
  undoHistory,
  onUndo,
  onExportJSON,
  onResetSeed,
  darkMode,
  setDarkMode,
}) => {
  const [showUndoDropdown, setShowUndoDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { key: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Store },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'transactions', label: 'Stock In/Out', icon: ArrowDownToLine },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { key: 'orders', label: 'Orders', icon: ListOrdered },
    { key: 'analysis', label: 'ABC Analysis', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group flex items-center gap-2.5 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              BG
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap block leading-tight">
                Bhagwati General Store
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-normal">
                Inventory &amp; Stock Management
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Medium Screen Nav (Scrollable) */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 overflow-x-auto max-w-md scrollbar-none py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Export JSON Button */}
          <button
            onClick={onExportJSON}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Export all inventory, orders, and transactions to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export JSON</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetSeed}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Reset store data to initial seed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset Seed</span>
          </button>

          {/* Undo Action Button with Stack count */}
          <div className="relative">
            <div className="flex items-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm">
              <button
                onClick={onUndo}
                disabled={undoCount === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-opacity ${
                  undoCount === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
                }`}
                title={undoCount > 0 ? `Undo last operation (Stack has ${undoCount}/20 actions)` : 'Undo stack is empty'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
                <span className="font-mono tabular-nums text-[10px] bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded">
                  {undoCount}
                </span>
              </button>

              <button
                onClick={() => setShowUndoDropdown(!showUndoDropdown)}
                className="px-1.5 py-1.5 border-l border-white/20 dark:border-black/20 hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
                title="View Undo History Stack"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Undo History Dropdown Drawer */}
            {showUndoDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                    <History className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Undo Stack (Last 20 Actions)</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    LIFO Bound: 20
                  </span>
                </div>

                {undoHistory.length === 0 ? (
                  <div className="py-6 text-center text-neutral-400 text-xs">
                    No operations in undo stack yet. Perform add, update, delete, delivery, or stock operations.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {undoHistory.map((action, idx) => (
                      <div
                        key={action.id}
                        className="p-2 rounded bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[11px] text-neutral-800 dark:text-neutral-200">
                            #{undoHistory.length - idx} · {action.type}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(action.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 text-[11px] line-clamp-1">
                          {action.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {undoHistory.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        onUndo();
                        setShowUndoDropdown(false);
                      }}
                      className="w-full py-1.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                    >
                      Undo Top Action
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                onExportJSON();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 py-1 px-2 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => {
                onResetSeed();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 py-1 px-2 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seed</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
