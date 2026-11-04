/**
 * ============================================================================
 * DATA STRUCTURE: HashTable (Separate Chaining & Open Addressing / Linear Probing)
 * ============================================================================
 * Features:
 * 1. Mode Toggle: Switch between Chaining and Open Addressing (Linear Probing).
 * 2. Custom polynomial rolling hash function:
 *    h(s) = (sum_{i=0}^{L-1} s[i] * 31^{L-1-i}) mod capacity
 * 3. Dynamic resizing when load factor exceeds 0.75.
 * 4. Strictly manual: NO built-in Map, Set, or Object-key lookups.
 * 
 * Complexity Analysis:
 * - put(key, value):       Time: O(1) average, O(n) worst case | Space: O(1)
 * - get(key):              Time: O(1) average, O(n) worst case | Space: O(1)
 * - remove(key):           Time: O(1) average, O(n) worst case | Space: O(1)
 * - has(key):              Time: O(1) average, O(n) worst case | Space: O(1)
 * - resize(newCapacity):   Time: O(n)                          | Space: O(n)
 * - getAll():              Time: O(n)                          | Space: O(n)
 * - Overall Space:         O(n + M) where M is bucket capacity
 * ============================================================================
 */

import { HashTableMode, HashTableStats } from '../types';

export class HashNode<V> {
  key: string;
  value: V;
  next: HashNode<V> | null;

  constructor(key: string, value: V, next: HashNode<V> | null = null) {
    this.key = key;
    this.value = value;
    this.next = next;
  }
}

export interface OpenAddrEntry<V> {
  key: string;
  value: V;
  isDeleted: boolean;
  probeDistance?: number;
}

export interface BucketChainVisual<V> {
  index: number;
  entries: { key: string; value: V; isDeleted?: boolean }[];
  chainLength: number;
  isOccupied?: boolean;
  probeDistance?: number;
}

export class HashTable<V> {
  private capacity: number;
  private count: number;
  private mode: HashTableMode;
  private buckets: (HashNode<V> | null)[];
  private openTable: (OpenAddrEntry<V> | null)[];
  private tombstoneCount: number;
  private totalCollisionsLogged: number;

  constructor(initialCapacity = 31, mode: HashTableMode = 'CHAINING') {
    this.capacity = Math.max(7, initialCapacity);
    this.count = 0;
    this.mode = mode;
    this.tombstoneCount = 0;
    this.totalCollisionsLogged = 0;

    this.buckets = new Array(this.capacity);
    this.openTable = new Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      this.buckets[i] = null;
      this.openTable[i] = null;
    }
  }

  public getMode(): HashTableMode {
    return this.mode;
  }

  public setMode(newMode: HashTableMode): void {
    if (this.mode === newMode) return;
    const all = this.getAll();
    this.mode = newMode;
    this.clear();
    for (let i = 0; i < all.length; i++) {
      this.put(all[i].key, all[i].value);
    }
  }

  /**
   * Custom polynomial rolling hash function:
   * h(s) = (sum(s[i] * 31^(len-1-i))) mod capacity
   */
  public hash(key: string, cap = this.capacity): number {
    let hashVal = 0;
    const prime = 31;
    for (let i = 0; i < key.length; i++) {
      const code = key.charCodeAt(i);
      hashVal = (hashVal * prime + code) % cap;
    }
    return (hashVal + cap) % cap;
  }

  /**
   * Insert or update key-value pair.
   * Resizes dynamically when load factor exceeds 0.75.
   */
  public put(key: string, value: V): void {
    const cleanKey = key.trim().toUpperCase();
    if ((this.count + 1) / this.capacity > 0.75) {
      this.resize(this.nextPrime(this.capacity * 2));
    }

    if (this.mode === 'CHAINING') {
      this.putChaining(cleanKey, value);
    } else {
      this.putOpenAddressing(cleanKey, value);
    }
  }

  private putChaining(key: string, value: V): void {
    const idx = this.hash(key);
    let head = this.buckets[idx];

    if (head === null) {
      this.buckets[idx] = new HashNode(key, value);
      this.count++;
      return;
    }

    this.totalCollisionsLogged++;
    let curr: HashNode<V> | null = head;
    while (curr !== null) {
      if (curr.key === key) {
        curr.value = value;
        return;
      }
      if (curr.next === null) {
        break;
      }
      curr = curr.next;
    }

    curr!.next = new HashNode(key, value);
    this.count++;
  }

  private putOpenAddressing(key: string, value: V): void {
    const initialHash = this.hash(key);
    let firstDeletedIdx = -1;

    for (let i = 0; i < this.capacity; i++) {
      const idx = (initialHash + i) % this.capacity;
      const slot = this.openTable[idx];

      if (slot === null) {
        const targetIdx = firstDeletedIdx !== -1 ? firstDeletedIdx : idx;
        if (firstDeletedIdx !== -1) {
          this.tombstoneCount--;
        }
        this.openTable[targetIdx] = {
          key,
          value,
          isDeleted: false,
          probeDistance: (targetIdx - initialHash + this.capacity) % this.capacity,
        };
        this.count++;
        return;
      }

      if (slot.isDeleted) {
        if (firstDeletedIdx === -1) {
          firstDeletedIdx = idx;
        }
      } else if (slot.key === key) {
        slot.value = value;
        return;
      }
    }

    if (firstDeletedIdx !== -1) {
      this.tombstoneCount--;
      this.openTable[firstDeletedIdx] = {
        key,
        value,
        isDeleted: false,
        probeDistance: (firstDeletedIdx - initialHash + this.capacity) % this.capacity,
      };
      this.count++;
      return;
    }

    this.resize(this.nextPrime(this.capacity * 2));
    this.putOpenAddressing(key, value);
  }

  /**
   * Retrieve value by key: O(1) average
   */
  public get(key: string): V | null {
    if (!key) return null;
    const cleanKey = key.trim().toUpperCase();

    if (this.mode === 'CHAINING') {
      const idx = this.hash(cleanKey);
      let curr = this.buckets[idx];
      while (curr !== null) {
        if (curr.key === cleanKey) {
          return curr.value;
        }
        curr = curr.next;
      }
      return null;
    } else {
      const initialHash = this.hash(cleanKey);
      for (let i = 0; i < this.capacity; i++) {
        const idx = (initialHash + i) % this.capacity;
        const slot = this.openTable[idx];
        if (slot === null) {
          return null;
        }
        if (!slot.isDeleted && slot.key === cleanKey) {
          return slot.value;
        }
      }
      return null;
    }
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove item by key
   */
  public remove(key: string): boolean {
    if (!key) return false;
    const cleanKey = key.trim().toUpperCase();

    if (this.mode === 'CHAINING') {
      const idx = this.hash(cleanKey);
      let curr = this.buckets[idx];
      let prev: HashNode<V> | null = null;

      while (curr !== null) {
        if (curr.key === cleanKey) {
          if (prev === null) {
            this.buckets[idx] = curr.next;
          } else {
            prev.next = curr.next;
          }
          this.count--;
          return true;
        }
        prev = curr;
        curr = curr.next;
      }
      return false;
    } else {
      const initialHash = this.hash(cleanKey);
      for (let i = 0; i < this.capacity; i++) {
        const idx = (initialHash + i) % this.capacity;
        const slot = this.openTable[idx];
        if (slot === null) {
          return false;
        }
        if (!slot.isDeleted && slot.key === cleanKey) {
          slot.isDeleted = true;
          this.count--;
          this.tombstoneCount++;
          return true;
        }
      }
      return false;
    }
  }

  public getAll(): { key: string; value: V }[] {
    const list: { key: string; value: V }[] = [];
    if (this.mode === 'CHAINING') {
      for (let i = 0; i < this.capacity; i++) {
        let curr = this.buckets[i];
        while (curr !== null) {
          list.push({ key: curr.key, value: curr.value });
          curr = curr.next;
        }
      }
    } else {
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.openTable[i];
        if (slot !== null && !slot.isDeleted) {
          list.push({ key: slot.key, value: slot.value });
        }
      }
    }
    return list;
  }

  public clear(): void {
    this.count = 0;
    this.tombstoneCount = 0;
    this.totalCollisionsLogged = 0;
    for (let i = 0; i < this.capacity; i++) {
      this.buckets[i] = null;
      this.openTable[i] = null;
    }
  }

  public size(): number {
    return this.count;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  private resize(newCapacity: number): void {
    const oldAll = this.getAll();
    this.capacity = newCapacity;
    this.clear();
    for (let i = 0; i < oldAll.length; i++) {
      this.put(oldAll[i].key, oldAll[i].value);
    }
  }

  public getStats(): HashTableStats {
    let longestChain = 0;
    let collisions = 0;

    if (this.mode === 'CHAINING') {
      for (let i = 0; i < this.capacity; i++) {
        let len = 0;
        let curr = this.buckets[i];
        while (curr !== null) {
          len++;
          curr = curr.next;
        }
        if (len > longestChain) {
          longestChain = len;
        }
        if (len > 1) {
          collisions += len - 1;
        }
      }
    } else {
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.openTable[i];
        if (slot !== null && !slot.isDeleted) {
          if (slot.probeDistance && slot.probeDistance > 0) {
            collisions++;
            if (slot.probeDistance > longestChain) {
              longestChain = slot.probeDistance;
            }
          }
        }
      }
    }

    return {
      capacity: this.capacity,
      count: this.count,
      loadFactor: Number((this.count / this.capacity).toFixed(3)),
      collisions,
      longestChain,
      mode: this.mode,
      tombstones: this.tombstoneCount,
    };
  }

  public getBucketsVisual(): BucketChainVisual<V>[] {
    const visual: BucketChainVisual<V>[] = [];

    if (this.mode === 'CHAINING') {
      for (let i = 0; i < this.capacity; i++) {
        const entries: { key: string; value: V }[] = [];
        let curr = this.buckets[i];
        while (curr !== null) {
          entries.push({ key: curr.key, value: curr.value });
          curr = curr.next;
        }
        visual.push({
          index: i,
          entries,
          chainLength: entries.length,
          isOccupied: entries.length > 0,
        });
      }
    } else {
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.openTable[i];
        const entries: { key: string; value: V; isDeleted?: boolean }[] = [];
        if (slot !== null) {
          entries.push({
            key: slot.key,
            value: slot.value,
            isDeleted: slot.isDeleted,
          });
        }
        visual.push({
          index: i,
          entries,
          chainLength: entries.length,
          isOccupied: slot !== null && !slot.isDeleted,
          probeDistance: slot?.probeDistance || 0,
        });
      }
    }

    return visual;
  }

  private isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  private nextPrime(n: number): number {
    let candidate = Math.floor(n);
    if (candidate % 2 === 0) candidate++;
    while (!this.isPrime(candidate)) {
      candidate += 2;
    }
    return candidate;
  }
}
