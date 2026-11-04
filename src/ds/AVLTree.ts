/**
 * ============================================================================
 * DATA STRUCTURE: AVL Tree (Self-Balancing Binary Search Tree)
 * ============================================================================
 * Handles non-unique keys (such as duplicate prices ₹25, ₹30, ₹70) by storing
 * a list of items per price node.
 * 
 * Complexity Analysis:
 * - insert(key, item, itemId):  Time: O(log n)              | Space: O(1)
 * - delete(key, itemId):        Time: O(log n)              | Space: O(1)
 * - search(key):                Time: O(log n)              | Space: O(1)
 * - rangeQuery(min, max):       Time: O(log n + k)          | Space: O(k)
 * - inOrderTraversal():         Time: O(n)                  | Space: O(n)
 * - Rotations (LL, RR, LR, RL): Time: O(1)                  | Space: O(1)
 * - Overall Tree Space:         O(n) where n is unique prices
 * ============================================================================
 */

export interface AVLItemEntry<T> {
  id: string;
  data: T;
}

export class AVLNode<T> {
  key: number;
  items: AVLItemEntry<T>[];
  height: number;
  left: AVLNode<T> | null;
  right: AVLNode<T> | null;

  constructor(key: number, item: T, itemId: string) {
    this.key = key;
    this.items = [{ id: itemId, data: item }];
    this.height = 1;
    this.left = null;
    this.right = null;
  }
}

export interface AVLNodeVisual {
  key: number;
  price?: number;
  sku?: string;
  itemCount: number;
  itemIds: string[];
  height: number;
  balanceFactor: number;
  left?: AVLNodeVisual | null;
  right?: AVLNodeVisual | null;
}

export class AVLTree<T> {
  private root: AVLNode<T> | null;
  private totalItemCount: number;
  private uniqueKeyCount: number;

  constructor() {
    this.root = null;
    this.totalItemCount = 0;
    this.uniqueKeyCount = 0;
  }

  private getHeight(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getBalanceFactor(node: AVLNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private updateHeight(node: AVLNode<T>): void {
    const lh = this.getHeight(node.left);
    const rh = this.getHeight(node.right);
    node.height = 1 + (lh > rh ? lh : rh);
  }

  /**
   * Right Rotation (LL Case)
   * Time: O(1) | Space: O(1)
   */
  private rightRotate(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  /**
   * Left Rotation (RR Case)
   * Time: O(1) | Space: O(1)
   */
  private leftRotate(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  /**
   * Insert item into tree.
   * If key already exists (duplicate price), appends to node.items list.
   * Time: O(log n) | Space: O(1)
   */
  public insert(
    keyOrItem: number | ({ price: number; sku: string } & T),
    item?: T,
    itemId?: string
  ): void {
    let key: number;
    let actualItem: T;
    let actualId: string;

    if (typeof keyOrItem === 'number') {
      key = keyOrItem;
      actualItem = item!;
      actualId = itemId || '';
    } else {
      key = (keyOrItem as any).price;
      actualItem = keyOrItem as T;
      actualId = (keyOrItem as any).sku || '';
    }

    this.root = this.insertNode(this.root, key, actualItem, actualId);
    this.totalItemCount++;
  }

  private insertNode(
    node: AVLNode<T> | null,
    key: number,
    item: T,
    itemId: string
  ): AVLNode<T> {
    if (node === null) {
      this.uniqueKeyCount++;
      return new AVLNode(key, item, itemId);
    }

    if (key < node.key) {
      node.left = this.insertNode(node.left, key, item, itemId);
    } else if (key > node.key) {
      node.right = this.insertNode(node.right, key, item, itemId);
    } else {
      // Key matches: duplicate price! Check if itemId exists, else append
      let found = false;
      for (let i = 0; i < node.items.length; i++) {
        if (node.items[i].id === itemId) {
          node.items[i].data = item; // update
          found = true;
          break;
        }
      }
      if (!found) {
        node.items.push({ id: itemId, data: item });
      }
      return node;
    }

    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    // LL Case
    if (balance > 1 && key < node.left!.key) {
      return this.rightRotate(node);
    }

    // RR Case
    if (balance < -1 && key > node.right!.key) {
      return this.leftRotate(node);
    }

    // LR Case
    if (balance > 1 && key > node.left!.key) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    // RL Case
    if (balance < -1 && key < node.right!.key) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  public delete(
    keyOrItem: number | ({ price: number; sku: string } & Partial<T>),
    itemId?: string
  ): boolean {
    let key: number;
    let actualId: string;

    if (typeof keyOrItem === 'number') {
      key = keyOrItem;
      actualId = itemId || '';
    } else {
      key = (keyOrItem as any).price;
      actualId = (keyOrItem as any).sku || '';
    }

    const prevCount = this.totalItemCount;
    this.root = this.deleteNode(this.root, key, actualId);
    return this.totalItemCount < prevCount;
  }

  private findMinNode(node: AVLNode<T>): AVLNode<T> {
    let curr = node;
    while (curr.left !== null) {
      curr = curr.left;
    }
    return curr;
  }

  private deleteNode(
    node: AVLNode<T> | null,
    key: number,
    itemId: string
  ): AVLNode<T> | null {
    if (node === null) {
      return null;
    }

    if (key < node.key) {
      node.left = this.deleteNode(node.left, key, itemId);
    } else if (key > node.key) {
      node.right = this.deleteNode(node.right, key, itemId);
    } else {
      // Found price node: remove itemId from items list
      let itemIdx = -1;
      for (let i = 0; i < node.items.length; i++) {
        if (node.items[i].id === itemId) {
          itemIdx = i;
          break;
        }
      }

      if (itemIdx !== -1) {
        for (let i = itemIdx; i < node.items.length - 1; i++) {
          node.items[i] = node.items[i + 1];
        }
        node.items.pop();
        this.totalItemCount--;
      }

      // If items still remain at this price, node stays
      if (node.items.length > 0) {
        return node;
      }

      // Node has no more items: delete this node from AVL tree
      this.uniqueKeyCount--;
      if (node.left === null || node.right === null) {
        const temp = node.left !== null ? node.left : node.right;
        if (temp === null) {
          node = null;
        } else {
          node = temp;
        }
      } else {
        const temp = this.findMinNode(node.right);
        node.key = temp.key;
        node.items = [...temp.items];
        // Delete successor node from right subtree
        node.right = this.deleteNode(node.right, temp.key, temp.items[0]?.id || '');
      }
    }

    if (node === null) {
      return null;
    }

    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    // LL Case
    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      return this.rightRotate(node);
    }

    // LR Case
    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    // RR Case
    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      return this.leftRotate(node);
    }

    // RL Case
    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  /**
   * Search for items with exact key
   * Time: O(log n) | Space: O(1)
   */
  public search(key: number): T[] {
    let curr = this.root;
    while (curr !== null) {
      if (key === curr.key) {
        const res: T[] = [];
        for (let i = 0; i < curr.items.length; i++) {
          res.push(curr.items[i].data);
        }
        return res;
      } else if (key < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return [];
  }

  /**
   * Range Query: all items with key in [minKey, maxKey] (inclusive).
   * Prunes subtrees outside range.
   * Time: O(log n + k) | Space: O(k)
   */
  public rangeQuery(minKey: number, maxKey: number): T[] {
    const result: T[] = [];
    this.rangeQueryHelper(this.root, minKey, maxKey, result);
    return result;
  }

  private rangeQueryHelper(
    node: AVLNode<T> | null,
    minKey: number,
    maxKey: number,
    result: T[]
  ): void {
    if (node === null) return;

    if (node.key > minKey) {
      this.rangeQueryHelper(node.left, minKey, maxKey, result);
    }

    if (node.key >= minKey && node.key <= maxKey) {
      for (let i = 0; i < node.items.length; i++) {
        result.push(node.items[i].data);
      }
    }

    if (node.key < maxKey) {
      this.rangeQueryHelper(node.right, minKey, maxKey, result);
    }
  }

  /**
   * In-order traversal: returns items strictly sorted by key ascending
   * Time: O(n) | Space: O(n)
   */
  public inOrderTraversal(): T[] {
    const result: T[] = [];
    this.inOrderHelper(this.root, result);
    return result;
  }

  private inOrderHelper(node: AVLNode<T> | null, result: T[]): void {
    if (node === null) return;
    this.inOrderHelper(node.left, result);
    for (let i = 0; i < node.items.length; i++) {
      result.push(node.items[i].data);
    }
    this.inOrderHelper(node.right, result);
  }

  public size(): number {
    return this.totalItemCount;
  }

  public uniqueKeys(): number {
    return this.uniqueKeyCount;
  }

  public clear(): void {
    this.root = null;
    this.totalItemCount = 0;
    this.uniqueKeyCount = 0;
  }

  /**
   * Visualizer structure generator for tree diagrams
   */
  public getVisualTree(node: AVLNode<T> | null = this.root, maxDepth = 4, depth = 0): AVLNodeVisual | null {
    if (node === null || depth > maxDepth) return null;
    const itemIds: string[] = [];
    for (let i = 0; i < node.items.length; i++) {
      itemIds.push(node.items[i].id);
    }
    return {
      key: node.key,
      price: node.key,
      sku: itemIds[0] || '',
      itemCount: node.items.length,
      itemIds,
      height: node.height,
      balanceFactor: this.getBalanceFactor(node),
      left: this.getVisualTree(node.left, maxDepth, depth + 1),
      right: this.getVisualTree(node.right, maxDepth, depth + 1),
    };
  }

  public getTreeVisual(maxDepth = 4): AVLNodeVisual | null {
    return this.getVisualTree(this.root, maxDepth);
  }
}
