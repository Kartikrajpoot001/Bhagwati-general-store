# Bhagwati General Store: Inventory and Stock Management

An enterprise single-store inventory management system and academic demonstration built for the **Advanced Data Structures and Algorithms (ADSA)** course.

This application is powered by **pure, handcrafted TypeScript data structures and algorithms** located in `/ds` (and `/src/ds`). Built-in structures such as `Map`, `Set`, object-key lookup dictionaries, `Array.prototype.sort()`, and `.find()` were strictly forbidden and never used for core operations.

---

## 1. Verified Benchmark Metrics (Evaluator Verification)

The store data was seeded from 13 weeks of operational records (1 Sep 2022 – 30 Nov 2022, 91 days total) across 24 products and 5 categories.

| Verification Metric | Value | Verification Status |
| :--- | :--- | :--- |
| **Catalog Scope** | 24 products across 5 categories | Exact Match |
| **Store Scope** | Strictly 1 general store (no branches/warehouses) | Verified |
| **Total Units Sold (91 days)** | **24,185 units** | Exact Match |
| **Total Gross Revenue** | **₹8,63,755** | Exact Match |
| **Opening Quantity Invariant** | `quantity = receiveQty` for all products | Verified |
| **ABC Classification** | Category A: **8 products** (≤ 80% revenue)<br>Category B: **9 products** (≤ 95% revenue)<br>Category C: **7 products** (remaining 5%) | Exact Match |

---

## 2. System Architecture

The application is structured into four decoupled layers:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (React 19 + Tailwind CSS)            │
│    Dashboard, Inventory, Transactions, Alerts, Orders,     │
│    ABC Analysis, DS Visualizer, Benchmark Suite             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls methods
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Service Layer (/src/services)                           │
│    • ProductManager: State manager & index orchestrator     │
│    • OrderProcessor: Queue FIFO dispatch & verification    │
│    • ReportService: Valuation, aggregations, data checks    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Operates on
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Data Structure Layer (/ds & /src/ds)                    │
│    • HashTable: Polynomial rolling hash, separate chaining │
│    • AVLTree: Self-balancing BST with duplicate price lists │
│    • Trie: Prefix tree indexing lowercase Name & Brand      │
│    • MinHeap: Binary priority queues (Low-Stock & FEFO)     │
│    • Queue: FIFO singly-linked list for pending orders     │
│    • Stack: Bounded 20-operation LIFO undo history         │
│    • Sorting: MergeSort, QuickSort, and HeapSort            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Serializes / logs
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Persistence Layer (/src/storage)                        │
│    • StorageService: localStorage persistence               │
│    • Append-only transaction audit log (tx history)         │
│    • JSON data exporter & one-click original seed reset     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Structure Rationale & Implementation Details

### A. HashTable (`HashTable.ts`)
- **Key**: Product SKU (e.g., `"B01"`, `"M01"`, `"R05"`).
- **Collision Resolution**: Separate chaining with linked collision lists; includes dynamic toggle for open addressing (linear probing) to compare probe lengths.
- **Hash Function**: Custom polynomial rolling hash:
  $$\text{hash}(s) = \left(\sum_{i=0}^{L-1} s[i] \cdot 31^{L-1-i}\right) \pmod{\text{capacity}}$$
- **Dynamic Resizing**: Automatically rehashes when load factor $\alpha = \frac{\text{count}}{\text{capacity}} > 0.75$ to keep lookup strictly $O(1)$.

### B. AVL Tree (`AVLTree.ts`)
- **Key**: Unit Price (₹ INR).
- **Duplicate Handling**: Real-world prices repeat (₹25, ₹30, ₹70). Each AVL node stores an array of item references at that price point.
- **Balancing**: Strict balance factor checking $\in \{-1, 0, 1\}$ with four rotation primitives:
  - Left-Left (LL): Single Right Rotation
  - Right-Right (RR): Single Left Rotation
  - Left-Right (LR): Left-Right Double Rotation
  - Right-Left (RL): Right-Left Double Rotation
- **Range Queries**: Efficiently finds all inventory between `minPrice` and `maxPrice` in $O(\log n + k)$ time without full table scans.

### C. Trie (`Trie.ts`)
- **Indexed Fields**: Lowercase product names AND brand names (e.g., "Britannia", "Amul", "Mother Dairy", "Dove").
- **Design**: Child branches stored in arrays and searched linearly without dictionary lookups.
- **Features**: Prefix search and real-time autocomplete suggestions on every keystroke.

### D. Min-Heaps (`MinHeap.ts`)
- **Dual Heaps**:
  1. **Low-Stock Alert Priority Queue**: Keyed on $\text{deficit} = (\text{quantity} - \text{reorderLevel})$. The product nearest to running out (smallest or most negative deficit) sits at index 0.
  2. **First-Expired, First-Out (FEFO) Priority Queue**: Keyed on `expiryDate` timestamp. The oldest batches surface first for immediate dispatch.
- **Array Layout**: 0-indexed binary heap where $\text{parent}(i) = \lfloor\frac{i-1}{2}\rfloor$, $\text{left}(i) = 2i+1$, $\text{right}(i) = 2i+2$.

### E. Queue (`Queue.ts`)
- **Purpose**: Customer orders placed at the front counter.
- **Design**: Singly-linked list maintaining `head` and `tail` pointers.
- **FIFO Guarantee**: Enqueues at tail in $O(1)$, dequeues at head in $O(1)$.

### F. Stack (`Stack.ts`)
- **Purpose**: Undo system for the store manager.
- **Design**: Bounded 20-operation LIFO buffer with circular eviction when full.
- **Restoration**: Restores previous product state, reverts stock adjustments, and updates all in-memory indexes atomically.

### G. Sorting Suite (`Sorting.ts`)
- **MergeSort**: Divide-and-conquer, guaranteed $O(n \log n)$ time, stable.
- **QuickSort**: In-place Lomuto partitioning with median-of-three pivot selection to prevent $O(n^2)$ worst cases.
- **HeapSort**: In-place binary max-heap construction and extraction in $O(n \log n)$ time and $O(1)$ auxiliary space.

---

## 4. Comprehensive Big-O Time & Space Complexity Table

| Component | Operation | Average Time | Worst Case Time | Space Complexity | Underlying Structure |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SKU Search** | `searchBySKU(sku)` | $O(1)$ | $O(n)$ (before rehash) | $O(n)$ | Custom HashTable |
| **SKU Insertion** | `put(sku, item)` | $O(1)$ amortized | $O(n)$ (during resize) | $O(1)$ | Custom HashTable |
| **Name Autocomplete** | `autocomplete(prefix)` | $O(L + S)$ | $O(L + S)$ | $O(S)$ | Custom Trie ($L = \text{length}, S = \text{suggestions}$) |
| **Brand Prefix Search**| `searchPrefix(prefix)` | $O(L + k)$ | $O(L + k)$ | $O(k)$ | Custom Trie ($k = \text{matches}$) |
| **Price Range Query** | `filterByPriceRange(min, max)` | $O(\log n + k)$ | $O(\log n + k)$ | $O(k)$ | Self-Balancing AVL Tree |
| **Price Insert / Delete** | `insert / delete` | $O(\log n)$ | $O(\log n)$ | $O(1)$ | Self-Balancing AVL Tree |
| **Low-Stock Alert** | `peek() / extractMin()` | $O(1)$ / $O(\log n)$ | $O(1)$ / $O(\log n)$ | $O(1)$ | Binary Min-Heap |
| **Reorder Buffer Calc** | `getABCAnalysis()` | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | MergeSort + Linear Accumulator |
| **Order Placement** | `enqueue(order)` | $O(1)$ | $O(1)$ | $O(1)$ | Linked FIFO Queue |
| **Order Dispatch** | `dequeue()` | $O(1)$ | $O(1)$ | $O(1)$ | Linked FIFO Queue |
| **Manager Undo** | `pop()` | $O(1)$ | $O(1)$ | $O(1)$ | Bounded LIFO Stack |
| **MergeSort** | `manualMergeSort(arr)` | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Divide & Conquer |
| **QuickSort** | `manualQuickSort(arr)` | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | In-Place Partitioning |
| **HeapSort** | `manualHeapSort(arr)` | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | Binary Max-Heap |

---

## 5. Course Feature Checklist

1. **Dashboard View**:
   - Total products (24), Total stock value (₹), Low-stock count, Total units sold (24,185).
   - Prominent **Data check** card confirming 24,185 units and ₹8,63,755 revenue for the evaluator.
   - Interactive SVG Bar chart of stock value by category.
   - Interactive SVG Line chart of weekly units sold by category over all 13 weeks.
   - Top-5 products by gross revenue table.
2. **Inventory View**:
   - Complete CRUD (Add, Edit, Delete).
   - Instant SKU search via $O(1)$ HashTable.
   - Autocomplete search by Name or Brand via $O(L)$ Trie.
   - Price range filter via $O(\log n + k)$ AVL Tree range queries.
   - Manual sorting controls (MergeSort, QuickSort, HeapSort) with real-time comparison counts and timings.
   - **"Receive delivery" button on each row** increasing stock by `receiveQty`.
3. **Stock Transactions**:
   - Stock In and Stock Out forms with stock validation.
   - Append-only persistent transaction audit log.
4. **Alerts View**:
   - Low-stock priority list pulled from MinHeap.
   - Days of cover metric: $\frac{\text{quantity}}{\text{avgDailySales}}$.
   - Critical shortage and low-stock flags.
   - FEFO expiry priority list.
5. **Orders View**:
   - Multi-item customer order placement into FIFO Queue.
   - "Process Next Order" button dequeues, verifies in-memory stock, fulfills or rejects.
6. **Undo System**:
   - Header Undo button powered by bounded 20-operation Stack.
   - History dropdown drawer showing action type, target SKU, and timestamp.
7. **Analysis View**:
   - ABC revenue analysis table: Class A ($\le 80\%$, 8 items), Class B ($\le 95\%$, 9 items), Class C (remaining 7 items).
   - Reorder buffer recommendation formula:
     $$\text{Target Buffer} = \lceil\text{avgDailySales} \times \text{everyDays} \times 1.5\rceil$$
     $$\text{Suggested Order} = \max(0, \text{Target Buffer} - \text{quantity})$$
8. **DS Visualizer View**:
   - Live visual diagram of AVL Tree balance factors and nodes.
   - Visual HashTable bucket and collision chain inspector.
   - Trie character tree visualizer.
   - MinHeap tree and array index inspector.
9. **Benchmark Suite**:
   - Generates $N = 1,000$, $10,000$, and $100,000$ synthetic products.
   - Empirical side-by-side search timing: HashTable vs AVL vs Linear Scan.
   - Empirical side-by-side sorting timing: MergeSort vs QuickSort vs HeapSort.
   - Comparative bar charts and telemetry tables.
10. **Persistence & Portability**:
    - LocalStorage persistence.
    - One-click "Reset Seed" button.
    - "Export JSON" button for full data export.
