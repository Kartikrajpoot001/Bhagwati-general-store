/**
 * ============================================================================
 * DATA STRUCTURE: MinHeap (Binary Priority Queue)
 * ============================================================================
 * 0-indexed array layout:
 * - parent(i) = floor((i - 1) / 2)
 * - left(i)   = 2 * i + 1
 * - right(i)  = 2 * i + 2
 * 
 * Used for Low-Stock prioritization where key = (quantity - reorderLevel).
 * Smallest key (highest deficit / danger of running out) sits at root [0].
 * 
 * Complexity Analysis:
 * - insert(item):        Time: O(log n) | Space: O(1)
 * - extractMin():        Time: O(log n) | Space: O(1)
 * - peek():              Time: O(1)     | Space: O(1)
 * - remove(predicate):   Time: O(n)     | Space: O(1)
 * - heapify():           Time: O(n)     | Space: O(1)
 * - getSortedList():     Time: O(n log n) | Space: O(n)
 * - Overall Space:       O(n) array storage
 * ============================================================================
 */

export type HeapComparator<T> = (a: T, b: T) => number;

export class MinHeap<T> {
  private heap: T[];
  private compare: HeapComparator<T>;

  constructor(compare: HeapComparator<T>) {
    this.heap = [];
    this.compare = compare;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): T | null {
    if (this.heap.length === 0) return null;
    return this.heap[0];
  }

  /**
   * Insert item into heap. Time: O(log n)
   */
  public insert(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  /**
   * Extract and remove the minimum element at root. Time: O(log n)
   */
  public extractMin(): T | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  private siftUp(index: number): void {
    let curr = index;
    while (curr > 0) {
      const parentIdx = Math.floor((curr - 1) / 2);
      if (this.compare(this.heap[curr], this.heap[parentIdx]) < 0) {
        const temp = this.heap[curr];
        this.heap[curr] = this.heap[parentIdx];
        this.heap[parentIdx] = temp;
        curr = parentIdx;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let curr = index;
    const len = this.heap.length;

    while (true) {
      let smallest = curr;
      const left = 2 * curr + 1;
      const right = 2 * curr + 2;

      if (left < len && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== curr) {
        const temp = this.heap[curr];
        this.heap[curr] = this.heap[smallest];
        this.heap[smallest] = temp;
        curr = smallest;
      } else {
        break;
      }
    }
  }

  /**
   * Remove item matching predicate and restore heap invariant
   */
  public remove(predicate: (item: T) => boolean): boolean {
    let targetIdx = -1;
    for (let i = 0; i < this.heap.length; i++) {
      if (predicate(this.heap[i])) {
        targetIdx = i;
        break;
      }
    }

    if (targetIdx === -1) return false;

    const last = this.heap.pop()!;
    if (targetIdx < this.heap.length) {
      this.heap[targetIdx] = last;
      this.siftDown(targetIdx);
      this.siftUp(targetIdx);
    }
    return true;
  }

  /**
   * Linear-time build / re-heapify
   */
  public rebuild(items: T[]): void {
    this.heap = [];
    for (let i = 0; i < items.length; i++) {
      this.heap.push(items[i]);
    }
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.siftDown(i);
    }
  }

  public getArray(): T[] {
    const copy: T[] = [];
    for (let i = 0; i < this.heap.length; i++) {
      copy.push(this.heap[i]);
    }
    return copy;
  }

  /**
   * Extract all items in ascending sorted order using heapsort on a clone
   */
  public getSortedList(): T[] {
    const clone = new MinHeap<T>(this.compare);
    for (let i = 0; i < this.heap.length; i++) {
      clone.insert(this.heap[i]);
    }
    const result: T[] = [];
    while (!clone.isEmpty()) {
      result.push(clone.extractMin()!);
    }
    return result;
  }

  public clear(): void {
    this.heap = [];
  }
}

/**
 * Comparator for low stock alerts: smallest (quantity - reorderLevel) first.
 * If negative, quantity < reorderLevel (critical shortage).
 */
export const lowStockComparator = (
  a: { quantity: number; reorderLevel: number },
  b: { quantity: number; reorderLevel: number }
): number => {
  return (a.quantity - a.reorderLevel) - (b.quantity - b.reorderLevel);
};

/**
 * Comparator for FEFO (First-Expired, First-Out): earliest expiry date first.
 */
export const fefoExpiryComparator = (
  a: { expiryDate?: string },
  b: { expiryDate?: string }
): number => {
  const timeA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
  const timeB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
  return timeA - timeB;
};

