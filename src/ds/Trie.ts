/**
 * ============================================================================
 * DATA STRUCTURE: Trie (Prefix Tree)
 * ============================================================================
 * Indexes lowercase strings (product name, brand, or SKU) for autocomplete
 * and instant prefix searching.
 * Child nodes are stored in an array and searched linearly (strictly no
 * built-in Map, Set, object-key dictionary lookups, or .find()).
 * 
 * Complexity Analysis:
 * - insert(word, item, id):    Time: O(L) where L is string length | Space: O(L)
 * - searchPrefix(prefix):      Time: O(L + K) where K is subtree   | Space: O(K)
 * - autocomplete(prefix, max): Time: O(L + S)                      | Space: O(S)
 * - remove(word, id):          Time: O(L)                          | Space: O(1)
 * - Overall Space:             O(Σ * N * L) nodes across vocabulary
 * ============================================================================
 */

export interface TrieEntry<T> {
  id: string;
  data: T;
}

export interface TrieChild<T> {
  char: string;
  node: TrieNode<T>;
}

export class TrieNode<T> {
  char: string;
  isEndOfWord: boolean;
  entries: TrieEntry<T>[];
  children: TrieChild<T>[];

  constructor(char = '') {
    this.char = char;
    this.isEndOfWord = false;
    this.entries = [];
    this.children = [];
  }

  /**
   * Linear child search without Map, Set, or .find()
   */
  public findChild(c: string): TrieNode<T> | null {
    const target = c.toLowerCase();
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].char === target) {
        return this.children[i].node;
      }
    }
    return null;
  }

  public addChild(c: string, node: TrieNode<T>): void {
    const target = c.toLowerCase();
    this.children.push({ char: target, node });
  }

  public removeChild(c: string): boolean {
    const target = c.toLowerCase();
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].char === target) {
        for (let j = i; j < this.children.length - 1; j++) {
          this.children[j] = this.children[j + 1];
        }
        this.children.pop();
        return true;
      }
    }
    return false;
  }
}

export interface TrieVisualNode {
  char: string;
  isWord: boolean;
  isEndOfWord?: boolean;
  itemCount: number;
  productCount?: number;
  childCount: number;
  children: TrieVisualNode[];
}

export class Trie<T> {
  private root: TrieNode<T>;
  private nodeCount: number;

  constructor() {
    this.root = new TrieNode<T>();
    this.nodeCount = 1;
  }

  /**
   * Insert string key into Trie and attach item reference.
   * Time: O(L) | Space: O(L)
   */
  public insert(
    textOrItem: string | ({ name: string; sku: string; brand?: string } & T),
    item?: T,
    itemId?: string
  ): void {
    let clean: string;
    let actualItem: T;
    let actualId: string;

    if (typeof textOrItem === 'string') {
      if (!textOrItem || textOrItem.trim() === '') return;
      clean = textOrItem.trim().toLowerCase();
      actualItem = item!;
      actualId = itemId || (item as any)?.sku || '';
    } else {
      const name = (textOrItem as any)?.name || '';
      if (!name.trim()) return;
      clean = name.trim().toLowerCase();
      actualItem = textOrItem as T;
      actualId = (textOrItem as any)?.sku || '';
    }

    let curr = this.root;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      let child = curr.findChild(char);
      if (child === null) {
        child = new TrieNode<T>(char);
        curr.addChild(char, child);
        this.nodeCount++;
      }
      curr = child;
    }

    curr.isEndOfWord = true;

    // Check if item with this ID already exists
    let exists = false;
    for (let i = 0; i < curr.entries.length; i++) {
      if (curr.entries[i].id === actualId) {
        curr.entries[i].data = actualItem;
        exists = true;
        break;
      }
    }
    if (!exists) {
      curr.entries.push({ id: actualId, data: actualItem });
    }
  }

  /**
   * Search for all items matching a given prefix.
   * Time: O(L + K) | Space: O(K)
   */
  public searchPrefix(prefix: string): T[] {
    if (!prefix || prefix.trim() === '') return [];
    const clean = prefix.trim().toLowerCase();
    let curr = this.root;

    for (let i = 0; i < clean.length; i++) {
      const child = curr.findChild(clean[i]);
      if (child === null) {
        return [];
      }
      curr = child;
    }

    const collected: T[] = [];
    const visitedIds: string[] = [];
    this.collectSubtreeItems(curr, collected, visitedIds);
    return collected;
  }

  private collectSubtreeItems(
    node: TrieNode<T>,
    result: T[],
    visitedIds: string[]
  ): void {
    if (node.isEndOfWord) {
      for (let i = 0; i < node.entries.length; i++) {
        const id = node.entries[i].id;
        let seen = false;
        for (let j = 0; j < visitedIds.length; j++) {
          if (visitedIds[j] === id) {
            seen = true;
            break;
          }
        }
        if (!seen) {
          visitedIds.push(id);
          result.push(node.entries[i].data);
        }
      }
    }

    for (let i = 0; i < node.children.length; i++) {
      this.collectSubtreeItems(node.children[i].node, result, visitedIds);
    }
  }

  /**
   * Autocomplete: returns word strings and item count matching prefix.
   * Time: O(L + S) | Space: O(S)
   */
  public autocomplete(prefix: string, maxSuggestions = 6): { word: string; count: number }[] {
    if (!prefix || prefix.trim() === '') return [];
    const clean = prefix.trim().toLowerCase();
    let curr = this.root;

    for (let i = 0; i < clean.length; i++) {
      const child = curr.findChild(clean[i]);
      if (child === null) {
        return [];
      }
      curr = child;
    }

    const suggestions: { word: string; count: number }[] = [];
    this.collectWords(curr, clean, suggestions, maxSuggestions);
    return suggestions;
  }

  private collectWords(
    node: TrieNode<T>,
    currentWord: string,
    suggestions: { word: string; count: number }[],
    limit: number
  ): void {
    if (suggestions.length >= limit) return;

    if (node.isEndOfWord && node.entries.length > 0) {
      suggestions.push({
        word: currentWord,
        count: node.entries.length,
      });
    }

    for (let i = 0; i < node.children.length; i++) {
      if (suggestions.length >= limit) break;
      this.collectWords(
        node.children[i].node,
        currentWord + node.children[i].char,
        suggestions,
        limit
      );
    }
  }

  /**
   * Remove item reference from word
   */
  public remove(textOrItem: string | ({ name: string; sku: string } & Partial<T>), itemId?: string): void {
    let clean: string;
    let actualId: string;

    if (typeof textOrItem === 'string') {
      if (!textOrItem) return;
      clean = textOrItem.trim().toLowerCase();
      actualId = itemId || '';
    } else {
      clean = ((textOrItem as any)?.name || '').trim().toLowerCase();
      actualId = (textOrItem as any)?.sku || '';
    }

    if (!clean) return;
    this.removeHelper(this.root, clean, 0, actualId);
  }

  private removeHelper(
    curr: TrieNode<T>,
    word: string,
    index: number,
    itemId: string
  ): boolean {
    if (index === word.length) {
      if (!curr.isEndOfWord) return false;

      let found = -1;
      for (let i = 0; i < curr.entries.length; i++) {
        if (curr.entries[i].id === itemId) {
          found = i;
          break;
        }
      }
      if (found !== -1) {
        for (let i = found; i < curr.entries.length - 1; i++) {
          curr.entries[i] = curr.entries[i + 1];
        }
        curr.entries.pop();
      }

      if (curr.entries.length === 0) {
        curr.isEndOfWord = false;
      }

      return curr.children.length === 0 && !curr.isEndOfWord;
    }

    const char = word[index];
    const child = curr.findChild(char);
    if (child === null) return false;

    const canDeleteChild = this.removeHelper(child, word, index + 1, itemId);
    if (canDeleteChild) {
      curr.removeChild(char);
      this.nodeCount--;
      return curr.children.length === 0 && !curr.isEndOfWord;
    }
    return false;
  }

  public size(): number {
    return this.nodeCount;
  }

  public clear(): void {
    this.root = new TrieNode<T>();
    this.nodeCount = 1;
  }

  public getVisualTree(maxDepth = 3): TrieVisualNode {
    return this.toVisual(this.root, 0, maxDepth);
  }

  private toVisual(node: TrieNode<T>, depth: number, maxDepth: number): TrieVisualNode {
    const children: TrieVisualNode[] = [];
    if (depth < maxDepth) {
      for (let i = 0; i < node.children.length; i++) {
        children.push(this.toVisual(node.children[i].node, depth + 1, maxDepth));
      }
    }
    return {
      char: node.char || 'ROOT',
      isWord: node.isEndOfWord,
      isEndOfWord: node.isEndOfWord,
      itemCount: node.entries.length,
      productCount: node.entries.length,
      childCount: node.children.length,
      children,
    };
  }
}
