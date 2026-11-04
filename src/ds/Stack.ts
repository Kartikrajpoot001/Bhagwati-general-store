/**
 * ============================================================================
 * DATA STRUCTURE: Bounded Stack (LIFO Undo History)
 * ============================================================================
 * Stores operations with a fixed upper bound (capacity = 20).
 * Pushing beyond capacity evicts the oldest element at the bottom.
 * 
 * Complexity Analysis:
 * - push(item):    Time: O(1) | Space: O(1)
 * - pop():         Time: O(1) | Space: O(1)
 * - peek():        Time: O(1) | Space: O(1)
 * - size():        Time: O(1) | Space: O(1)
 * - toArray():     Time: O(K) where K = min(N, capacity) | Space: O(K)
 * - Overall Space: O(capacity) bounded memory
 * ============================================================================
 */

export class StackNode<T> {
  value: T;
  next: StackNode<T> | null;

  constructor(value: T, next: StackNode<T> | null = null) {
    this.value = value;
    this.next = next;
  }
}

export class Stack<T> {
  private topNode: StackNode<T> | null;
  private count: number;
  private readonly maxCapacity: number;

  constructor(maxCapacity = 20) {
    this.topNode = null;
    this.count = 0;
    this.maxCapacity = maxCapacity;
  }

  /**
   * Push item to top of stack. If count > maxCapacity, evict bottom.
   * Time: O(1)
   */
  public push(value: T): void {
    this.topNode = new StackNode(value, this.topNode);
    this.count++;

    if (this.count > this.maxCapacity) {
      this.evictBottom();
    }
  }

  /**
   * Pop most recent item. Time: O(1)
   */
  public pop(): T | null {
    if (this.topNode === null) {
      return null;
    }
    const val = this.topNode.value;
    this.topNode = this.topNode.next;
    this.count--;
    return val;
  }

  /**
   * Peek at top item without removing. Time: O(1)
   */
  public peek(): T | null {
    if (this.topNode === null) return null;
    return this.topNode.value;
  }

  public size(): number {
    return this.count;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  public clear(): void {
    this.topNode = null;
    this.count = 0;
  }

  /**
   * Return items from top (most recent) to bottom. Time: O(K)
   */
  public toArray(): T[] {
    const list: T[] = [];
    let curr = this.topNode;
    while (curr !== null) {
      list.push(curr.value);
      curr = curr.next;
    }
    return list;
  }

  private evictBottom(): void {
    if (this.topNode === null || this.topNode.next === null) {
      this.topNode = null;
      this.count = 0;
      return;
    }

    let curr = this.topNode;
    while (curr.next !== null && curr.next.next !== null) {
      curr = curr.next;
    }
    curr.next = null;
    this.count = this.maxCapacity;
  }
}
