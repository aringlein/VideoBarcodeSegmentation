// import 'Assert'

/**
 * Iterable Priority Queue attaches priorities to keys, values.
 *
 * The hierarchy goes priority->key->value. There can be multiple key-value
 * pairs per priority. Only one key can be used per priority, but the same key
 * can be used across multiple priorities.
 * ie. Each priority has a set of keys, each of which has a single value.
 */
class PriorityQueue {
  constructor() {
    // Linear representation of binary minheap tree.
    this._heap = [null];
    // Stores mapping from priority to Node id.
    this._priorityMap = {};
    // Stores mapping from key to Node ids.
    this._keyMap = new PriorityQueue.KeyMap();
    // Stores unique ids for Nodes.
    this._nodes = {};
  }

  // Returns true if node(s) with 'priority' has 'key'.
  has(priority, key) {
    if (!this._hasPriority(priority)) return false;

    const nodeId = this._priorityMap[priority];
    const node = this._getNode(nodeId);

    return node.has(key);
  }

  // Returns the value associated with 'key' of node with 'priority'.
  get(priority, key) {
    if (!this.has(priority, key)) return null;

    const nodeId = this._priorityMap[priority];
    const node = this._getNode(nodeId);

    return node.get(key);
  }

  // Returns true if 'key' exists in any node.
  hasKey(key) {
    return this._keyMap.has(key);
  }

  // Push 'data' into the queue with 'priority'. Replaces any existing value
  // associated with 'key' if 'key' exists.
  push(priority, key, value) {
    // Only one node is created per priority, so key-values on the same priority
    // are appended to the same node. Any new values replace old values for the
    // same key.
    if (this._hasPriority(priority)) {
      const nodeId = this._priorityMap[priority];
      this._keyMap.add(key, nodeId);
      this._getNode(nodeId).set(key, value);
    } else {
      const node = new PriorityQueue.Node(priority);
      this._nodes[node.id] = node;
      node.set(key, value);
      this._bubble(this._heap.push(node.id) - 1);
      this._priorityMap[priority] = node.id;
      this._keyMap.add(key, node.id);
    }
  }

  // Pop the data with highest 'priority' in insertion order, or null if there
  // is nothing left.
  pop() {
    if (this._heap.length == 1) {
      return null;
    }
    const topNodeId = this._heap[1];
    const topNode = this._getNode(topNodeId);
    let topData = null;
    if (topNode.size > 0) {
      topData = topNode.pop();

      const topKey = topData.key;
      this._keyMap.deleteNode(topKey, topNode);
    }

    if (topNode.size === 0) {
      const last = this._heap.pop();
      if (this._heap.length > 1) {
        this._heap[1] = last;
        this._sink(1);
      }
      delete this._priorityMap[topNode.priority];
      delete this._nodes[topNode.id];
    }

    if (topData === null) return this.pop();

    return topData;
  }

  // Remove all data associated with 'key'.
  removeKey(key) {
    if (!this._keyMap.has(key)) return false;

    const nodeIds = this._keyMap.get(key);
    for (let nodeId of nodeIds) {
      const node = this._getNode(nodeId);
      node.delete(key);
    }
    this._keyMap.delete(key);

    return true;
  }

  // Returns a cloned copy of the priority queue. Note that nodes are cloned by
  // reference (not a deep clone).
  clone() {
    const clone = new PriorityQueue();
    clone._heap = this._heap.slice();
    Object.assign(clone._priorityMap, this._priorityMap);
    Object.assign(clone._keyMap, this._keyMap);
    Object.assign(clone._nodes, this._nodes);
    for (let nodeId in clone._nodes) {
      clone._nodes[nodeId] = clone._nodes[nodeId].clone();
    }
    return clone;
  }

  [Symbol.iterator]() {
    const clone = this.clone();

    return {
      next() {
        const data = clone.pop();
        if (data === null) {
          return { done: true };
        }
        return { value: data, done: false };
      }
    };
  }

  // Bubbles node i up the binary tree based on priority until heap conditions
  // are restored.
  _bubble(i) {
    while (i > 1) {
      const parentIndex = i >> 1; // floor(i/2)

      // Don't bubble if equal (maintains insertion order).
      if (!this._isHigherPriority(i, parentIndex)) break;

      this._swap(i, parentIndex);
      i = parentIndex;
    }
  }

  // Does the opposite of the '_bubble'.
  _sink(i) {
    while (i * 2 < this._heap.length) {
      // If equal, left bubbles (maintains insertion order).
      const leftChildIndex = i * 2;
      const rightChildIndex = i * 2 + 1;
      const leftHigher =
          !this._isHigherPriority(rightChildIndex, leftChildIndex);
      const childIndex = leftHigher ? leftChildIndex : rightChildIndex;

      // If equal, sink happens (maintains insertion order).
      if (this._isHigherPriority(i, childIndex)) break;

      this._swap(i, childIndex);
      i = childIndex;
    }
  }

  // Swaps the addresses of 2 nodes.
  _swap(i, j) {
    const temp = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = temp;
  }

  // Returns true if node i is higher priority than j.
  _isHigherPriority(i, j) {
    const nodeI = this._getNode(this._heap[i]);
    const nodeJ = this._getNode(this._heap[j]);
    if (!nodeI || !nodeJ) return false;
    return nodeI.priority < nodeJ.priority;
  }

  _getNode(nodeId) {
    return this._nodes[nodeId];
  }

  // Returns true if node(s) with 'priority' exists.
  _hasPriority(priority) {
    return priority in this._priorityMap;
  }
};

/**
 * A priority queue node.
 */
PriorityQueue.Node = class {
  constructor(priority, data = new Map()) {
    this._priority = priority;
    this._data = data;
    this._id = PriorityQueue.Node._nextNodeId ++;
  }

  get priority() {
    return this._priority;
  }
  get data() {
    return this._data;
  }
  get id() {
    return this._id;
  }
  get size() {
    return this._data.size;
  }

  set(key, value) {
    return this._data.set(key, value);
  }
  get(key) {
    return this._data.get(key);
  }
  has(key) {
    return this._data.has(key);
  }
  delete(key) {
    return this._data.delete(key);
  }

  // Pops the next KeyValue from the Node, or null if empty.
  pop() {
    if (this._data.size == 0) return null;

    const nextKeyValue =
        new PriorityQueue.KeyValue(this._data.entries().next().value);
    this._data.delete(nextKeyValue.key);

    return nextKeyValue;
  }

  clone() {
    return new PriorityQueue.Node(this._priority, new Map(this._data));
  }
};

PriorityQueue.Node._nextNodeId = 0;

/**
 * DDO for a key-value pair.
 */
PriorityQueue.KeyValue = class {
  // Creates a KeyValue with 'key', 'value'. 'key' can be tuple array with
  // ['key', 'value'].
  constructor(key, value) {
    if (key.constructor === Array) {
      this._key = key[0];
      this._value = key[1];
    } else {
      this._key = key;
      this._value = value;
    }
  }

  get key() {
    return this._key;
  }
  get value() {
    return this._value;
  }
};

/**
 * Stores mapping from key to Node ids.
 */
PriorityQueue.KeyMap = class {
  constructor() {
    this._keyMap = new Map();
  }

  // Adds 'nodeId' into the Set for 'key'.
  add(key, nodeId) {
    if (!this._keyMap.has(key)) {
      this._keyMap.set(key, new Set());
    }
    this._keyMap.get(key).add(nodeId);
  }

  // Get the Set of nodeIds for 'key'.
  get(key) {
    return this._keyMap.get(key);
  }

  // Delets the Set for 'key'.
  delete(key) {
    this._keyMap.delete(key);
  }

  // Deletes the 'node' for 'key'. Returns successful or not.
  deleteNode(key, nodeId) {
    if (this._keyMap.has(key)) {
      this._keyMap.get(key).delete(nodeId);
      if (this._keyMap.get(key).size == 0) {
        this.delete(key);
      }
    }

    return false;
  }

  has(key) {
    return this._keyMap.has(key);
  }

  clone() {
    const clone = new PriorityQueue.KeyMap();
    for (let [key, nodeIds] of this._keyMap) {
      clone._keyMap.set(key, new Set(nodeIds));
    }
    return clone;
  }
}
