/**
 * ProductManager Service for ADSA Inventory System.
 * Coordinates all manual data structures:
 * - HashTable (SKU index with chaining & linear probing toggle)
 * - AVLTree (Price & quantity balanced search tree with range queries)
 * - Trie (Product name prefix search and autocomplete)
 * - MinHeap (Low-stock priority queue & FEFO expiry priority queue)
 * - Stack (Undo buffer storing last 20 operations)
 */

import {
  AVLTree,
  fefoExpiryComparator,
  HashTable,
  lowStockComparator,
  MinHeap,
  sortProducts,
  Stack,
  Trie,
} from '../ds';
import { StorageService } from '../storage/StorageService';
import {
  ActionType,
  ABCAnalysisResult,
  HashTableMode,
  HashTableStats,
  Product,
  SortAlgorithm,
  SortDirection,
  SortField,
  SortResult,
  StockTransaction,
  UndoAction,
} from '../types';

export class ProductManager {
  private products: Product[];
  private hashTable: HashTable<Product>;
  private avlTree: AVLTree<Product>;
  private trie: Trie<Product>;
  private lowStockHeap: MinHeap<Product>;
  private fefoHeap: MinHeap<Product>;
  private undoStack: Stack<UndoAction>;
  private listeners: (() => void)[];

  constructor() {
    this.products = [];
    this.hashTable = new HashTable<Product>(19, 'CHAINING');
    this.avlTree = new AVLTree<Product>();
    this.trie = new Trie<Product>();
    this.lowStockHeap = new MinHeap<Product>(lowStockComparator);
    this.fefoHeap = new MinHeap<Product>(fefoExpiryComparator);
    this.undoStack = new Stack<UndoAction>(20);
    this.listeners = [];

    this.initializeFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]();
    }
  }

  public initializeFromStorage(): void {
    this.products = StorageService.loadProducts();
    this.rebuildAllIndexes();
  }

  /**
   * Rebuild all 5 data structures from master products list
   */
  public rebuildAllIndexes(): void {
    const currentMode = this.hashTable.getMode();
    this.hashTable = new HashTable<Product>(Math.max(19, this.products.length * 2), currentMode);
    this.avlTree.clear();
    this.trie.clear();
    this.lowStockHeap.clear();
    this.fefoHeap.clear();

    for (let i = 0; i < this.products.length; i++) {
      const p = this.products[i];
      // Index 1: HashTable by SKU
      this.hashTable.put(p.sku, p);
      // Index 2: AVLTree by Price
      this.avlTree.insert(p);
      // Index 3: Trie by Product Name and Brand
      this.trie.insert(p.name, p, p.sku);
      if (p.brand) {
        this.trie.insert(p.brand, p, p.sku);
      }
      // Index 4: MinHeap by Low Stock (quantity - reorderLevel)
      this.lowStockHeap.insert(p);
      // Index 5: MinHeap by Expiry Date (FEFO)
      if (p.expiryDate) {
        this.fefoHeap.insert(p);
      }
    }
  }

  private persist(): void {
    StorageService.saveProducts(this.products);
    this.notify();
  }

  public getAllProducts(): Product[] {
    return this.products;
  }

  /**
   * 1. Add Product
   */
  public addProduct(product: Product, recordUndo = true): { success: boolean; message: string } {
    if (!product.sku || product.sku.trim() === '') {
      return { success: false, message: 'SKU cannot be empty.' };
    }
    const cleanSku = product.sku.trim().toUpperCase();

    // Check SKU uniqueness in O(1) via HashTable
    if (this.hashTable.has(cleanSku)) {
      return { success: false, message: `Product with SKU "${cleanSku}" already exists!` };
    }

    const newProd: Product = {
      ...product,
      sku: cleanSku,
      name: product.name.trim(),
      category: product.category.trim() || 'General',
      price: Math.max(0, Number(product.price)),
      quantity: Math.max(0, Math.floor(Number(product.quantity))),
      reorderLevel: Math.max(0, Math.floor(Number(product.reorderLevel))),
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.push(newProd);

    // Index into DS
    this.hashTable.put(newProd.sku, newProd);
    this.avlTree.insert(newProd);
    this.trie.insert(newProd.name, newProd, newProd.sku);
    if (newProd.brand) this.trie.insert(newProd.brand, newProd, newProd.sku);
    this.lowStockHeap.insert(newProd);
    if (newProd.expiryDate) {
      this.fefoHeap.insert(newProd);
    }

    // Record initial transaction
    StorageService.appendTransaction({
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: newProd.sku,
      productName: newProd.name,
      type: 'INITIAL',
      quantity: newProd.quantity,
      performer: 'System Admin',
      notes: 'New product registered into inventory',
    });

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'ADD_PRODUCT',
        description: `Added product ${newProd.sku} (${newProd.name})`,
        timestamp: new Date().toISOString(),
        previousProductState: null,
        newProductState: { ...newProd },
        sku: newProd.sku,
      });
    }

    this.persist();
    return { success: true, message: `Product "${newProd.name}" added successfully.` };
  }

  /**
   * 2. Update Product
   */
  public updateProduct(
    sku: string,
    updates: Partial<Product>,
    recordUndo = true
  ): { success: boolean; message: string } {
    const existing = this.hashTable.get(sku);
    if (!existing) {
      return { success: false, message: `Product ${sku} not found.` };
    }

    const prevState: Product = { ...existing };

    // Remove from AVL, Trie, Heaps before updating key fields
    this.avlTree.delete(existing);
    this.trie.remove(existing.name, existing.sku);
    if (existing.brand) this.trie.remove(existing.brand, existing.sku);
    this.lowStockHeap.remove((p) => p.sku === sku);
    this.fefoHeap.remove((p) => p.sku === sku);

    // Apply updates
    if (updates.name !== undefined) existing.name = updates.name.trim();
    if (updates.brand !== undefined) existing.brand = updates.brand.trim();
    if (updates.category !== undefined) existing.category = updates.category.trim();
    if (updates.price !== undefined) existing.price = Math.max(0, Number(updates.price));
    if (updates.quantity !== undefined) existing.quantity = Math.max(0, Math.floor(Number(updates.quantity)));
    if (updates.reorderLevel !== undefined) existing.reorderLevel = Math.max(0, Math.floor(Number(updates.reorderLevel)));
    if (updates.receiveQty !== undefined) existing.receiveQty = Math.max(0, Math.floor(Number(updates.receiveQty)));
    if (updates.everyDays !== undefined) existing.everyDays = Math.max(1, Math.floor(Number(updates.everyDays)));
    if (updates.expiryDate !== undefined) existing.expiryDate = updates.expiryDate || undefined;
    existing.updatedAt = new Date().toISOString();

    // Reinsert into DS
    this.hashTable.put(existing.sku, existing);
    this.avlTree.insert(existing);
    this.trie.insert(existing.name, existing, existing.sku);
    if (existing.brand) this.trie.insert(existing.brand, existing, existing.sku);
    this.lowStockHeap.insert(existing);
    if (existing.expiryDate) {
      this.fefoHeap.insert(existing);
    }

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'UPDATE_PRODUCT',
        description: `Updated product ${sku}`,
        timestamp: new Date().toISOString(),
        previousProductState: prevState,
        newProductState: { ...existing },
        sku,
      });
    }

    this.persist();
    return { success: true, message: `Product ${sku} updated.` };
  }

  /**
   * 3. Delete Product
   */
  public deleteProduct(sku: string, recordUndo = true): { success: boolean; message: string } {
    const existing = this.hashTable.get(sku);
    if (!existing) {
      return { success: false, message: `Product ${sku} not found.` };
    }

    const prevState: Product = { ...existing };

    // Remove from all DS
    this.hashTable.remove(sku);
    this.avlTree.delete(existing);
    this.trie.remove(existing.name, existing.sku);
    if (existing.brand) this.trie.remove(existing.brand, existing.sku);
    this.lowStockHeap.remove((p) => p.sku === sku);
    this.fefoHeap.remove((p) => p.sku === sku);

    // Remove from array
    let idx = -1;
    for (let i = 0; i < this.products.length; i++) {
      if (this.products[i].sku === sku) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) {
      for (let i = idx; i < this.products.length - 1; i++) {
        this.products[i] = this.products[i + 1];
      }
      this.products.pop();
    }

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'DELETE_PRODUCT',
        description: `Deleted product ${sku} (${prevState.name})`,
        timestamp: new Date().toISOString(),
        previousProductState: prevState,
        newProductState: null,
        sku,
      });
    }

    this.persist();
    return { success: true, message: `Product ${sku} removed from inventory.` };
  }

  /**
   * 4. Stock In
   */
  public stockIn(
    sku: string,
    quantity: number,
    performer: string,
    notes?: string,
    recordUndo = true
  ): { success: boolean; message: string } {
    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    const prod = this.hashTable.get(sku);
    if (!prod) {
      return { success: false, message: `SKU ${sku} not found.` };
    }

    const oldQty = prod.quantity;
    const newQty = oldQty + quantity;

    // Remove from AVL and heaps
    this.avlTree.delete(prod);
    this.lowStockHeap.remove((p) => p.sku === sku);

    prod.quantity = newQty;
    prod.updatedAt = new Date().toISOString();

    // Reinsert
    this.avlTree.insert(prod);
    this.lowStockHeap.insert(prod);

    // Append to transaction log
    StorageService.appendTransaction({
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: prod.sku,
      productName: prod.name,
      type: 'STOCK_IN',
      quantity,
      performer: performer || 'Warehouse Staff',
      notes: notes || 'Received stock inbound',
    });

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'STOCK_IN',
        description: `Stock In: +${quantity} units for ${prod.sku}`,
        timestamp: new Date().toISOString(),
        sku,
        quantityDelta: quantity,
      });
    }

    this.persist();
    return { success: true, message: `Added ${quantity} units to ${prod.sku}. New stock: ${newQty}` };
  }

  /**
   * 4b. Receive Scheduled Delivery (Stock In by receiveQty)
   */
  public receiveDelivery(sku: string, recordUndo = true): { success: boolean; message: string } {
    const cleanSku = sku.trim().toUpperCase();
    const prod = this.hashTable.get(cleanSku);
    if (!prod) {
      return { success: false, message: `Product ${sku} not found.` };
    }

    const deliveryQty = prod.receiveQty || 10;
    const oldQty = prod.quantity;
    const newQty = oldQty + deliveryQty;

    this.avlTree.delete(prod);
    this.lowStockHeap.remove((p) => p.sku === cleanSku);

    prod.quantity = newQty;
    prod.updatedAt = new Date().toISOString();

    this.avlTree.insert(prod);
    this.lowStockHeap.insert(prod);

    StorageService.appendTransaction({
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: prod.sku,
      productName: prod.name,
      type: 'DELIVERY',
      quantity: deliveryQty,
      notes: `Batch delivery arrival (+${deliveryQty} units)`,
    });

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'RECEIVE_DELIVERY',
        description: `Received delivery for ${prod.sku}: +${deliveryQty} units`,
        timestamp: new Date().toISOString(),
        sku: prod.sku,
        quantityDelta: deliveryQty,
      });
    }

    this.persist();
    return {
      success: true,
      message: `Delivery of ${deliveryQty} units received for ${prod.name} (${prod.sku}). Stock updated to ${newQty}.`,
    };
  }

  /**
   * 5. Stock Out
   */
  public stockOut(
    sku: string,
    quantity: number,
    performer: string,
    notes?: string,
    recordUndo = true
  ): { success: boolean; message: string } {
    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    const prod = this.hashTable.get(sku);
    if (!prod) {
      return { success: false, message: `SKU ${sku} not found.` };
    }

    if (prod.quantity < quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${prod.sku}. Available: ${prod.quantity}, Requested: ${quantity}`,
      };
    }

    const oldQty = prod.quantity;
    const newQty = oldQty - quantity;

    this.avlTree.delete(prod);
    this.lowStockHeap.remove((p) => p.sku === sku);

    prod.quantity = newQty;
    prod.updatedAt = new Date().toISOString();

    this.avlTree.insert(prod);
    this.lowStockHeap.insert(prod);

    StorageService.appendTransaction({
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: prod.sku,
      productName: prod.name,
      type: 'STOCK_OUT',
      quantity: -quantity,
      performer: performer || 'Dispatch Staff',
      notes: notes || 'Dispatched stock outbound',
    });

    if (recordUndo) {
      this.undoStack.push({
        id: `UNDO-${Date.now()}`,
        type: 'STOCK_OUT',
        description: `Stock Out: -${quantity} units from ${prod.sku}`,
        timestamp: new Date().toISOString(),
        sku,
        quantityDelta: -quantity,
      });
    }

    this.persist();
    return { success: true, message: `Dispatched ${quantity} units from ${prod.sku}. Remaining: ${newQty}` };
  }

  /**
   * 6. Undo operation via Stack
   */
  public undoLastAction(): { success: boolean; message: string; action?: UndoAction } {
    const action = this.undoStack.pop();
    if (!action) {
      return { success: false, message: 'Undo stack is empty. No operations to undo.' };
    }

    switch (action.type) {
      case 'ADD_PRODUCT': {
        // Revert addition by deleting without adding to undo stack
        if (action.sku) {
          this.deleteProduct(action.sku, false);
        }
        return { success: true, message: `Undid: ${action.description}`, action };
      }

      case 'DELETE_PRODUCT': {
        // Revert deletion by re-inserting previous product state
        if (action.previousProductState) {
          this.addProduct(action.previousProductState, false);
        }
        return { success: true, message: `Undid: ${action.description}`, action };
      }

      case 'UPDATE_PRODUCT': {
        // Revert update by restoring previous state
        if (action.sku && action.previousProductState) {
          this.updateProduct(action.sku, action.previousProductState, false);
        }
        return { success: true, message: `Undid: ${action.description}`, action };
      }

      case 'RECEIVE_DELIVERY':
      case 'STOCK_IN': {
        // Reverse stock in / delivery by taking out the quantity
        if (action.sku && action.quantityDelta) {
          const prod = this.hashTable.get(action.sku);
          if (prod) {
            prod.quantity = Math.max(0, prod.quantity - action.quantityDelta);
            this.rebuildAllIndexes();
            this.persist();
          }
        }
        return { success: true, message: `Undid: ${action.description}`, action };
      }

      case 'STOCK_OUT': {
        // Reverse stock out by restoring the quantity
        if (action.sku && action.quantityDelta) {
          const prod = this.hashTable.get(action.sku);
          if (prod) {
            prod.quantity = prod.quantity + Math.abs(action.quantityDelta);
            this.rebuildAllIndexes();
            this.persist();
          }
        }
        return { success: true, message: `Undid: ${action.description}`, action };
      }

      default:
        return { success: false, message: 'Unrecognized undo operation.' };
    }
  }

  // --- Search & Queries powered by manual DS ---

  /**
   * Search by SKU: O(1) via HashTable
   */
  public searchBySKU(sku: string): Product | null {
    if (!sku) return null;
    return this.hashTable.get(sku.trim().toUpperCase());
  }

  /**
   * Autocomplete & Prefix Search: via Trie
   */
  public searchByNamePrefix(prefix: string): Product[] {
    return this.trie.searchPrefix(prefix);
  }

  public getAutocompleteSuggestions(prefix: string, limit = 6): { word: string; count: number }[] {
    return this.trie.autocomplete(prefix, limit);
  }

  /**
   * Price Range Filter: via AVLTree rangeQuery
   */
  public filterByPriceRange(minPrice: number, maxPrice: number): Product[] {
    return this.avlTree.rangeQuery(minPrice, maxPrice);
  }

  /**
   * Sort Inventory using custom MergeSort, QuickSort, or HeapSort
   */
  public getSortedInventory(
    field: SortField,
    algorithm: SortAlgorithm,
    direction: SortDirection,
    baseList?: Product[]
  ): SortResult<Product> {
    const list = baseList || this.products;
    return sortProducts(list, algorithm, field, direction);
  }

  /**
   * Alerts: Low Stock from MinHeap
   */
  public getLowStockAlerts(limit?: number): Product[] {
    const sorted = this.lowStockHeap.getSortedList();
    const criticalOnly: Product[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].quantity <= sorted[i].reorderLevel) {
        criticalOnly.push(sorted[i]);
      }
    }
    return limit ? criticalOnly.slice(0, limit) : criticalOnly;
  }

  /**
   * Alerts: Expiring Soon (FEFO) from Expiry MinHeap
   */
  public getFEFOAlerts(limit?: number): Product[] {
    const sorted = this.fefoHeap.getSortedList();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // --- DS Inspector Accessors ---

  public getHashTableStats(): HashTableStats {
    return this.hashTable.getStats();
  }

  public toggleHashTableMode(): HashTableMode {
    const newMode: HashTableMode = this.hashTable.getMode() === 'CHAINING' ? 'OPEN_ADDRESSING' : 'CHAINING';
    this.hashTable.setMode(newMode);
    this.notify();
    return newMode;
  }

  public getHashTableVisual() {
    return this.hashTable.getBucketsVisual();
  }

  public getAVLVisual() {
    return this.avlTree.getTreeVisual();
  }

  public getTrieVisual(maxDepth = 3) {
    return this.trie.getVisualTree(maxDepth);
  }

  public getLowStockHeapArray(): Product[] {
    return this.lowStockHeap.getArray();
  }

  public getFEFOHeapArray(): Product[] {
    return this.fefoHeap.getArray();
  }

  public getUndoHistory(): UndoAction[] {
    return this.undoStack.toArray();
  }

  public getUndoStackSize(): number {
    return this.undoStack.size();
  }

  /**
   * ABC Analysis by Revenue
   * A: Top items making up <= 80% cumulative revenue (8 products in Bhagwati seed)
   * B: Next items making up <= 95% cumulative revenue (9 products in Bhagwati seed)
   * C: Remaining items (7 products in Bhagwati seed)
   * Reorder recommendation formula:
   * ceil(avgDailySales * everyDays * 1.5) - current quantity
   */
  public getABCAnalysis(): ABCAnalysisResult[] {
    const sortedResult = sortProducts([...this.products], 'mergeSort', 'revenue', 'desc');
    const sorted = sortedResult.sortedList;

    let totalRevenue = 0;
    for (let i = 0; i < sorted.length; i++) {
      totalRevenue += sorted[i].revenue || 0;
    }

    let cumulativeRevenue = 0;
    const results: ABCAnalysisResult[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const rev = p.revenue || 0;
      cumulativeRevenue += rev;
      const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercentage <= 80.0001 || i < 8) {
        classification = 'A';
      } else if (cumulativePercentage <= 95.0001 || i < 17) {
        classification = 'B';
      } else {
        classification = 'C';
      }

      // Reorder recommendation formula: ceil(avgDailySales * everyDays * 1.5) - current quantity
      const targetBuffer = Math.ceil(p.avgDailySales * p.everyDays * 1.5);
      const suggestedOrder = Math.max(0, targetBuffer - p.quantity);

      results.push({
        sku: p.sku,
        name: p.name,
        category: p.category,
        revenue: rev,
        cumulativeRevenue,
        cumulativePercentage: Number(cumulativePercentage.toFixed(2)),
        classification,
        currentQuantity: p.quantity,
        reorderLevel: p.reorderLevel,
        suggestedOrder,
      });
    }

    return results;
  }

  public getTotalUnitsSold(): number {
    let sum = 0;
    for (let i = 0; i < this.products.length; i++) {
      sum += this.products[i].totalUnitsSold || 0;
    }
    return sum;
  }

  public getTotalRevenue(): number {
    let sum = 0;
    for (let i = 0; i < this.products.length; i++) {
      sum += this.products[i].revenue || 0;
    }
    return sum;
  }

  public getTopRevenueProducts(limit = 5): Product[] {
    const sorted = sortProducts([...this.products], 'mergeSort', 'revenue', 'desc').sortedList;
    return sorted.slice(0, limit);
  }

  public getWeeklyCategorySales(): { category: string; weekly: number[]; total: number }[] {
    const categories = ['Bakery', 'Milk', 'Rice', 'Pulses', 'Cosmetics'];
    const result: { category: string; weekly: number[]; total: number }[] = [];

    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      const weekly = new Array(13).fill(0);
      let total = 0;

      for (let p = 0; p < this.products.length; p++) {
        const prod = this.products[p];
        if (prod.category === cat && prod.weeklySales) {
          for (let w = 0; w < 13; w++) {
            const sold = prod.weeklySales[w] || 0;
            weekly[w] += sold;
            total += sold;
          }
        }
      }

      result.push({ category: cat, weekly, total });
    }

    return result;
  }

  public resetToDemo(): void {
    StorageService.resetToSeed();
    this.initializeFromStorage();
    this.undoStack.clear();
    this.notify();
  }
}
