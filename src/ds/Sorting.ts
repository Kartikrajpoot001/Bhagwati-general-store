/**
 * ============================================================================
 * ALGORITHMS: Manual Sorting Suite (MergeSort, QuickSort, HeapSort)
 * ============================================================================
 * Implemented completely by hand without Array.prototype.sort().
 * 
 * Complexity Analysis:
 * 1. MergeSort:
 *    - Time:  O(n log n) best / average / worst (guaranteed)
 *    - Space: O(n) auxiliary buffer
 *    - Stable: Yes
 * 2. QuickSort:
 *    - Time:  O(n log n) average, O(n²) worst case
 *    - Space: O(log n) stack frames with median-of-three pivot
 *    - Stable: No (in-place partitioning)
 * 3. HeapSort:
 *    - Time:  O(n log n) best / average / worst
 *    - Space: O(1) in-place
 *    - Stable: No
 * ============================================================================
 */

import { SortAlgorithm, SortDirection, SortExecutionStats, SortField, SortResult } from '../types';

export type Comparator<T> = (a: T, b: T) => number;

/**
 * 1. Manual MergeSort implementation
 * Time: O(n log n) | Space: O(n)
 */
export function manualMergeSort<T>(
  arr: T[],
  compare: Comparator<T>,
  direction: SortDirection = 'asc'
): SortResult<T> {
  const startTime = performance.now();
  let comparisons = 0;
  let swapsOrMoves = 0;

  const items: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    items.push(arr[i]);
  }

  function merge(left: T[], right: T[]): T[] {
    const merged: T[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      comparisons++;
      const cmp = compare(left[i], right[j]);
      const effectiveCmp = direction === 'asc' ? cmp : -cmp;

      if (effectiveCmp <= 0) {
        merged.push(left[i]);
        i++;
      } else {
        merged.push(right[j]);
        j++;
      }
      swapsOrMoves++;
    }

    while (i < left.length) {
      merged.push(left[i]);
      i++;
      swapsOrMoves++;
    }

    while (j < right.length) {
      merged.push(right[j]);
      j++;
      swapsOrMoves++;
    }

    return merged;
  }

  function divideAndMerge(list: T[]): T[] {
    if (list.length <= 1) {
      return list;
    }

    const mid = Math.floor(list.length / 2);
    const left: T[] = [];
    const right: T[] = [];

    for (let i = 0; i < mid; i++) {
      left.push(list[i]);
    }
    for (let i = mid; i < list.length; i++) {
      right.push(list[i]);
    }

    const sortedLeft = divideAndMerge(left);
    const sortedRight = divideAndMerge(right);

    return merge(sortedLeft, sortedRight);
  }

  const sortedList = divideAndMerge(items);
  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    sortedList,
    stats: {
      comparisons,
      swapsOrMoves,
      executionTimeMs,
    },
  };
}

/**
 * 2. Manual QuickSort implementation (Median-of-three, in-place Lomuto)
 * Time: O(n log n) average | Space: O(log n) call stack
 */
export function manualQuickSort<T>(
  arr: T[],
  compare: Comparator<T>,
  direction: SortDirection = 'asc'
): SortResult<T> {
  const startTime = performance.now();
  let comparisons = 0;
  let swapsOrMoves = 0;

  const items: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    items.push(arr[i]);
  }

  function swap(i: number, j: number): void {
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
    swapsOrMoves++;
  }

  function compareDir(a: T, b: T): number {
    comparisons++;
    const res = compare(a, b);
    return direction === 'asc' ? res : -res;
  }

  function partition(low: number, high: number): number {
    // Median-of-three pivot selection
    const mid = Math.floor((low + high) / 2);
    if (compareDir(items[low], items[mid]) > 0) swap(low, mid);
    if (compareDir(items[low], items[high]) > 0) swap(low, high);
    if (compareDir(items[mid], items[high]) > 0) swap(mid, high);
    swap(mid, high);

    const pivot = items[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (compareDir(items[j], pivot) <= 0) {
        i++;
        swap(i, j);
      }
    }
    swap(i + 1, high);
    return i + 1;
  }

  function quickSortHelper(low: number, high: number): void {
    if (low < high) {
      const pi = partition(low, high);
      quickSortHelper(low, pi - 1);
      quickSortHelper(pi + 1, high);
    }
  }

  if (items.length > 1) {
    quickSortHelper(0, items.length - 1);
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    sortedList: items,
    stats: {
      comparisons,
      swapsOrMoves,
      executionTimeMs,
    },
  };
}

/**
 * 3. Manual HeapSort implementation
 * Time: O(n log n) | Space: O(1) in-place
 */
export function manualHeapSort<T>(
  arr: T[],
  compare: Comparator<T>,
  direction: SortDirection = 'asc'
): SortResult<T> {
  const startTime = performance.now();
  let comparisons = 0;
  let swapsOrMoves = 0;

  const items: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    items.push(arr[i]);
  }

  const n = items.length;

  function swap(i: number, j: number): void {
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
    swapsOrMoves++;
  }

  function compareDir(a: T, b: T): number {
    comparisons++;
    const res = compare(a, b);
    return direction === 'asc' ? res : -res;
  }

  function heapify(size: number, i: number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < size && compareDir(items[left], items[largest]) > 0) {
      largest = left;
    }

    if (right < size && compareDir(items[right], items[largest]) > 0) {
      largest = right;
    }

    if (largest !== i) {
      swap(i, largest);
      heapify(size, largest);
    }
  }

  // Build Max-Heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  // Extract from heap
  for (let i = n - 1; i > 0; i--) {
    swap(0, i);
    heapify(i, 0);
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    sortedList: items,
    stats: {
      comparisons,
      swapsOrMoves,
      executionTimeMs,
    },
  };
}

/**
 * Unified sort dispatcher
 */
export function genericSort<T>(
  arr: T[],
  compare: Comparator<T>,
  algorithm: SortAlgorithm,
  direction: SortDirection = 'asc'
): SortResult<T> {
  switch (algorithm) {
    case 'mergeSort':
      return manualMergeSort(arr, compare, direction);
    case 'quickSort':
      return manualQuickSort(arr, compare, direction);
    case 'heapSort':
      return manualHeapSort(arr, compare, direction);
    default:
      return manualMergeSort(arr, compare, direction);
  }
}

/**
 * Comparator generator for Product fields without object-key lookups
 */
export function getProductComparator(field: SortField): Comparator<any> {
  return (a: any, b: any): number => {
    switch (field) {
      case 'price':
        return a.price - b.price;
      case 'quantity':
        return a.quantity - b.quantity;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'revenue':
        return (a.revenue || 0) - (b.revenue || 0);
      case 'sku':
        return a.sku.localeCompare(b.sku);
      default:
        return a.price - b.price;
    }
  };
}

/**
 * Sorts products using specified manual algorithm
 */
export function sortProducts<T = any>(
  products: T[],
  algorithm: SortAlgorithm,
  field: SortField,
  direction: SortDirection = 'asc'
): SortResult<T> {
  const comparator = getProductComparator(field);
  return genericSort(products, comparator, algorithm, direction);
}

/**
 * Runs all 3 manual sorting algorithms on the same dataset to compare metrics
 */
export function benchmarkAllSorting<T = any>(
  products: T[],
  field: SortField = 'price',
  direction: SortDirection = 'asc'
): {
  mergeSort: SortResult<T>;
  quickSort: SortResult<T>;
  heapSort: SortResult<T>;
} {
  const comparator = getProductComparator(field);
  const mergeResult = manualMergeSort(products, comparator, direction);
  const quickResult = manualQuickSort(products, comparator, direction);
  const heapResult = manualHeapSort(products, comparator, direction);

  return {
    mergeSort: mergeResult,
    quickSort: quickResult,
    heapSort: heapResult,
  };
}

