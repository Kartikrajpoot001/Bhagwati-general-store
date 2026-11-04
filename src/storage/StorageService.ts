/**
 * Storage Service for Bhagwati General Store.
 * Handles localStorage persistence, transaction logging, seed data initialization,
 * and JSON data export.
 */

import { INITIAL_PRODUCTS } from '../data/seedData';
import { Order, Product, StockTransaction } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'bhagwati_store_products_v1',
  TRANSACTIONS: 'bhagwati_store_transactions_v1',
  ORDERS_PENDING: 'bhagwati_store_orders_pending_v1',
  ORDERS_HISTORY: 'bhagwati_store_orders_history_v1',
};

export class StorageService {
  public static loadProducts(): Product[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fall through to initial
    }
    // Seed initial dataset
    const seed = INITIAL_PRODUCTS;
    StorageService.saveProducts(seed);
    return seed;
  }

  public static saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }

  public static loadTransactions(): StockTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fall through to default
    }
    const initialTxs: StockTransaction[] = [
      {
        id: 'TXN-INIT-01',
        timestamp: '2022-09-01T08:00:00.000Z',
        sku: 'B01',
        productName: 'Pineapple Cake 55g',
        type: 'DELIVERY',
        quantity: 100,
        notes: 'Initial delivery arrival',
      },
      {
        id: 'TXN-INIT-02',
        timestamp: '2022-09-01T08:15:00.000Z',
        sku: 'M01',
        productName: 'Amul Milk 1/2 Litre',
        type: 'DELIVERY',
        quantity: 50,
        notes: 'Daily morning milk supply delivery',
      },
      {
        id: 'TXN-INIT-03',
        timestamp: '2022-09-01T08:30:00.000Z',
        sku: 'R05',
        productName: 'Gia International Rice 1 kg',
        type: 'DELIVERY',
        quantity: 20,
        notes: 'Initial batch delivery',
      },
    ];
    StorageService.saveTransactions(initialTxs);
    return initialTxs;
  }

  public static saveTransactions(transactions: StockTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }

  public static appendTransaction(tx: StockTransaction): void {
    const list = StorageService.loadTransactions();
    list.unshift(tx);
    StorageService.saveTransactions(list);
  }

  public static loadOrders(): { pending: Order[]; history: Order[] } {
    let pending: Order[] = [
      {
        id: 'ORD-101',
        createdAt: new Date().toISOString(),
        customerName: 'Sunita Verma',
        items: [
          { sku: 'M01', productName: 'Amul Milk 1/2 Litre', quantity: 2, unitPrice: 26 },
          { sku: 'B01', productName: 'Pineapple Cake 55g', quantity: 1, unitPrice: 25 },
        ],
        status: 'PENDING',
        totalAmount: 77,
      },
      {
        id: 'ORD-102',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        customerName: 'Rajesh Gupta',
        items: [
          { sku: 'R04', productName: 'Basmati Rice 1 kg', quantity: 2, unitPrice: 70 },
          { sku: 'P01', productName: 'Chana Daal 1 kg', quantity: 1, unitPrice: 70 },
        ],
        status: 'PENDING',
        totalAmount: 210,
      },
    ];
    let history: Order[] = [];

    try {
      const rawPending = localStorage.getItem(STORAGE_KEYS.ORDERS_PENDING);
      if (rawPending) {
        pending = JSON.parse(rawPending);
      } else {
        StorageService.saveOrders(pending, history);
      }

      const rawHist = localStorage.getItem(STORAGE_KEYS.ORDERS_HISTORY);
      if (rawHist) {
        history = JSON.parse(rawHist);
      }
    } catch {
      // Use defaults
    }

    return { pending, history };
  }

  public static saveOrders(pending: Order[], history: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS_PENDING, JSON.stringify(pending));
      localStorage.setItem(STORAGE_KEYS.ORDERS_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }

  public static resetToSeed(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS_PENDING);
      localStorage.removeItem(STORAGE_KEYS.ORDERS_HISTORY);
      StorageService.saveProducts(INITIAL_PRODUCTS);
      StorageService.loadTransactions();
      StorageService.loadOrders();
    } catch (e) {
      console.error('Reset failed', e);
    }
  }

  public static exportJSON(products: Product[], transactions: StockTransaction[], orders: { pending: Order[]; history: Order[] }): void {
    const data = {
      storeName: 'Bhagwati General Store',
      exportedAt: new Date().toISOString(),
      products,
      transactions,
      orders,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bhagwati_general_store_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
