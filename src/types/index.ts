/**
 * Core TypeScript definitions for Bhagwati General Store
 */

export interface Product {
  sku: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  receiveQty: number;
  everyDays: number;
  reorderLevel: number;
  quantity: number; // Opening quantity = receiveQty
  weeklySales: number[];
  totalUnitsSold: number;
  avgDailySales: number;
  revenue: number;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StockTransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'DELIVERY'
  | 'ORDER_FULFILLMENT'
  | 'INITIAL';

export interface StockTransaction {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  type: StockTransactionType;
  quantity: number;
  performer?: string;
  notes?: string;
}

export interface OrderItem {
  sku: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  items: OrderItem[];
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  rejectionReason?: string;
  totalAmount: number;
  processedAt?: string;
}

export type ActionType = 
  | 'ADD_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'RECEIVE_DELIVERY';

export interface UndoAction {
  id: string;
  type: ActionType;
  description: string;
  timestamp: string;
  previousProductState?: Product | null;
  newProductState?: Product | null;
  sku?: string;
  quantityDelta?: number;
}

export type HashTableMode = 'CHAINING' | 'OPEN_ADDRESSING';

export interface HashTableStats {
  capacity: number;
  count: number;
  loadFactor: number;
  collisions: number;
  longestChain: number;
  mode?: HashTableMode;
  tombstones?: number;
}

export type SortField = 'price' | 'quantity' | 'name' | 'category' | 'revenue' | 'sku';
export type SortAlgorithm = 'mergeSort' | 'quickSort' | 'heapSort';
export type SortDirection = 'asc' | 'desc';

export interface SortExecutionStats {
  comparisons: number;
  swapsOrMoves: number;
  executionTimeMs: number;
}

export interface SortResult<T> {
  sortedList: T[];
  stats: SortExecutionStats;
}

export interface ABCAnalysisResult {
  sku: string;
  name: string;
  category: string;
  revenue: number;
  cumulativeRevenue: number;
  cumulativePercentage: number;
  classification: 'A' | 'B' | 'C';
  currentQuantity: number;
  reorderLevel: number;
  suggestedOrder: number;
}

export interface BenchmarkResult {
  datasetSize: number;
  searchHashTableMs: number;
  searchAVLTreeMs: number;
  searchLinearScanMs: number;
  sortMergeMs: number;
  sortQuickMs: number;
  sortHeapMs: number;
}
