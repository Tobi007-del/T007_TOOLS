class StateNode {
  constructor() {
    this.children = {};
    this.value = null;
  }
}

class StateTrie {
  constructor() {
    this.root = new StateNode();
  }

  set(path, value) {
    let node = this.root;
    for (const key of path) node = node.children[key] ||= new StateNode();
    node.value = value;
  }

  get(path) {
    let node = this.root;
    for (const key of path) {
      if (!node.children[key]) return null;
      node = node.children[key];
    }
    return node.value;
  }

  delete(path) {
    let node = this.root;
    const stack = [];
    for (const key of path) {
      if (!node.children[key]) return false;
      stack.push([node, key]);
      node = node.children[key];
    }
    node.value = null;
    for (let i = stack.length - 1; i >= 0; i--) {
      const [parent, key] = stack[i];
      if (Object.keys(parent.children[key].children).length || parent.children[key].value !== null) break;
      delete parent.children[key];
    }
    return true;
  }
}

class RadixNode {
  constructor(label = "", value = null) {
    this.label = label;
    this.children = {};
    this.value = value;
  }
}

class RadixTrie {
  constructor() {
    this.root = new RadixNode();
  }

  set(path, value) {
    let node = this.root;
    let i = 0;
    while (i < path.length) {
      const char = path[i],
       child = node.children[char];
      if (!child) return void (node.children[char] = new RadixNode(path.slice(i), value));

    }
  }
}
