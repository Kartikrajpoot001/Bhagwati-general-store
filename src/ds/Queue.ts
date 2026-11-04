/**
 * ============================================================================
 * DATA STRUCTURE: FIFO Queue (Singly-Linked List)
 * ============================================================================
 * Implements strict First-In First-Out order processing using head and tail
 * pointers. Guarantees true O(1) enqueue and O(1) dequeue without Array.shift().
 * 
 * Complexity Analysis:
 * - enqueue(item): Time: O(1) | Space: O(1)
 * - dequeue():     Time: O(1) | Space: O(1)
 * - peek():        Time: O(1) | Space: O(1)
 * - size():        Time: O(1) | Space: O(1)
 * - toArray():     Time: O(n) | Space: O(n)
 * - Overall Space: O(n) linked nodes
 * ============================================================================
 */

export class QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;

  constructor(value: T, next: QueueNode<T> | null = null) {
    this.value = value;
    this.next = next;
  }
}

export class Queue<T> {
  private head: QueueNode<T> | null;
  private tail: QueueNode<T> | null;
  private count: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  /**
   * Enqueue item at tail. Time: O(1)
   */
  public enqueue(value: T): void {
    const newNode = new QueueNode(value);
    if (this.tail === null) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  /**
   * Dequeue item from head. Time: O(1)
   */
  public dequeue(): T | null {
    if (this.head === null) {
      return null;
    }
    const val = this.head.value;
    this.head = this.head.next;
    if (this.head === null) {
      this.tail = null;
    }
    this.count--;
    return val;
  }

  /**
   * Peek next item at head without removing. Time: O(1)
   */
  public peek(): T | null {
    if (this.head === null) return null;
    return this.head.value;
  }

  public size(): number {
    return this.count;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  public clear(): void {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  /**
   * Linear array export for UI rendering. Time: O(n)
   */
  public toArray(): T[] {
    const list: T[] = [];
    let curr = this.head;
    while (curr !== null) {
      list.push(curr.value);
      curr = curr.next;
    }
    return list;
  }
}
