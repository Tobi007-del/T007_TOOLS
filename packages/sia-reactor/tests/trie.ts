import type { ListenerRecord } from "../src/ts/types/reactor";

class TrieNode<T extends object> {
  children: Map<string, TrieNode<T>> = new Map(); // Maps a single path segment (e.g., "habits" or "*") to the next node
  listeners: ListenerRecord<T, any>[] = []; // The actual S.I.A listeners sitting at this specific path
}

export class PathTrie<T extends object> {
  private root: TrieNode<T> = new TrieNode();

  add(path: string, record: ListenerRecord<T, any>) {
    const parts = path.split(".");
    let curr = this.root;
    for (const part of parts) {
      if (!curr.children.has(part)) curr.children.set(part, new TrieNode<T>());
      curr = curr.children.get(part)!;
    }
    curr.listeners.push(record);
  }

  remove(path: string, cb: any) {
    const parts = path.split(".");
    let curr = this.root;
    for (const part of parts) {
      if (!curr.children.has(part)) return; // Path doesn't even exist
      curr = curr.children.get(part)!;
    }
    curr.listeners = curr.listeners.filter((rec) => rec.cb !== cb);
  }

  get(path: string): ListenerRecord<T, any>[] {
    if (path === "*") return this.root.children.get("*")?.listeners || [];
    const parts = path.split("."),
      results: ListenerRecord<T, any>[] = [];
    const search = (node: TrieNode<T>, depth: number) => {
      if (depth === parts.length) return void results.push(...node.listeners); // Base case: we reached the end of the event path
      const currSeg = parts[depth];
      if (node.children.has(currSeg)) search(node.children.get(currSeg)!, depth + 1); // Branch A: The Exact Match (e.g., "0")
      if (node.children.has("*")) search(node.children.get("*")!, depth + 1); // Branch B: The Wildcard Match (e.g., "*"), This means a listener on "habits.*" will catch "habits.0"
    };
    return search(this.root, 0), results; // Recursive search to walk both exact paths AND wildcard paths
  }

  clear() {
    this.root = new TrieNode();
  }
}
