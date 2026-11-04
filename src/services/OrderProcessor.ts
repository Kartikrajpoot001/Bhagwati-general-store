/**
 * OrderProcessor Service for ADSA Inventory System.
 * Uses custom FIFO Queue to manage pending orders in strict arrival sequence.
 * Dequeues orders, verifies stock against ProductManager, and fulfills or rejects.
 */

import { Queue } from '../ds/Queue';
import { StorageService } from '../storage/StorageService';
import { Order, OrderItem } from '../types';
import { ProductManager } from './ProductManager';

export interface ProcessOrderResult {
  order: Order | null;
  status: 'FULFILLED' | 'REJECTED' | 'QUEUE_EMPTY';
  message: string;
}

export class OrderProcessor {
  private queue: Queue<Order>;
  private history: Order[];
  private listeners: (() => void)[];

  constructor() {
    this.queue = new Queue<Order>();
    this.history = [];
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
    const { pending, history } = StorageService.loadOrders();
    this.queue.clear();
    for (let i = 0; i < pending.length; i++) {
      this.queue.enqueue(pending[i]);
    }
    this.history = history || [];
  }

  private persist(): void {
    StorageService.saveOrders(this.queue.toArray(), this.history);
    this.notify();
  }

  public getPendingOrders(): Order[] {
    return this.queue.toArray();
  }

  public getOrderHistory(): Order[] {
    return this.history;
  }

  public getQueueLength(): number {
    return this.queue.size();
  }

  /**
   * Place a new multi-item order: Enqueues at tail of Queue
   */
  public placeOrder(
    customerName: string,
    items: OrderItem[],
    productManager: ProductManager
  ): { success: boolean; order?: Order; message: string } {
    if (!customerName || customerName.trim() === '') {
      return { success: false, message: 'Customer name is required.' };
    }
    if (!items || items.length === 0) {
      return { success: false, message: 'Order must contain at least one item.' };
    }

    let totalAmount = 0;
    const enrichedItems: OrderItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.quantity <= 0) {
        return { success: false, message: `Invalid quantity for SKU ${item.sku}.` };
      }
      const prod = productManager.searchBySKU(item.sku);
      if (!prod) {
        return { success: false, message: `SKU ${item.sku} does not exist in inventory.` };
      }
      const unitPrice = prod.price;
      totalAmount += unitPrice * item.quantity;
      enrichedItems.push({
        sku: prod.sku,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      items: enrichedItems,
      status: 'PENDING',
      totalAmount: Number(totalAmount.toFixed(2)),
    };

    // FIFO Enqueue
    this.queue.enqueue(newOrder);
    this.persist();

    return {
      success: true,
      order: newOrder,
      message: `Order ${newOrder.id} placed and enqueued in position #${this.queue.size()}`,
    };
  }

  /**
   * Process next order in FIFO sequence from Queue head
   */
  public processNextOrder(productManager: ProductManager): ProcessOrderResult {
    if (this.queue.isEmpty()) {
      return {
        order: null,
        status: 'QUEUE_EMPTY',
        message: 'Order queue is currently empty. No pending orders to process.',
      };
    }

    const order = this.queue.dequeue()!;
    order.processedAt = new Date().toISOString();

    // Verify stock availability for ALL line items
    const shortages: string[] = [];
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const prod = productManager.searchBySKU(item.sku);
      if (!prod) {
        shortages.push(`${item.sku} (discontinued)`);
      } else if (prod.quantity < item.quantity) {
        shortages.push(`${prod.name} (has ${prod.quantity}, needed ${item.quantity})`);
      }
    }

    if (shortages.length > 0) {
      // Reject order
      order.status = 'REJECTED';
      order.rejectionReason = `Insufficient stock: ${shortages.join('; ')}`;
      this.history.unshift(order);
      this.persist();
      return {
        order,
        status: 'REJECTED',
        message: `Order ${order.id} was rejected due to stock shortages: ${shortages.join(', ')}`,
      };
    }

    // Fulfill order: atomically deduct stock for all items
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      productManager.stockOut(
        item.sku,
        item.quantity,
        `Auto-fulfillment [${order.id}]`,
        `Order fulfillment for ${order.customerName}`
      );
    }

    order.status = 'FULFILLED';
    this.history.unshift(order);
    this.persist();

    return {
      order,
      status: 'FULFILLED',
      message: `Order ${order.id} successfully fulfilled and dispatched for ${order.customerName} ($${order.totalAmount.toFixed(2)}).`,
    };
  }

  public clearQueue(): void {
    this.queue.clear();
    this.persist();
  }
}
