export class FieldMaskNode {
  children: Map<string, FieldMaskNode> = new Map();
  isLeaf: boolean = false;
}

export class FieldMaskTree {
  root: FieldMaskNode = new FieldMaskNode();

  constructor(paths: string[]) {
    for (const path of paths) {
      this.decodeCompactPath(path);
    }
  }

  /**
   * Decodes Apiary-style compact paths like "a.b(c,d)" into separate paths
   * "a.b.c" and "a.b.d".
   */
  private decodeCompactPath(path: string) {
    if (!path.includes('(')) {
      this.addPath(path);
      return;
    }

    const results: string[] = [];
    const stack: { prefix: string; current: string }[] = [{ prefix: '', current: '' }];

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char === '(') {
        const top = stack[stack.length - 1];
        stack.push({ prefix: (top.prefix ? top.prefix + '.' : '') + top.current, current: '' });
        top.current = ''; // Reset current for the next sibling
      } else if (char === ')') {
        const leaf = stack.pop()!;
        if (leaf.current) {
          results.push(leaf.prefix + '.' + leaf.current);
        }
      } else if (char === ',') {
        const leaf = stack[stack.length - 1];
        if (leaf.current) {
          results.push(leaf.prefix + '.' + leaf.current);
          leaf.current = '';
        }
      } else {
        stack[stack.length - 1].current += char;
      }
    }
    
    // Add any remaining top-level path
    if (stack[0].current) {
      results.push(stack[0].current);
    }

    for (const p of results) {
      this.addPath(p.replace(/^\./, ''));
    }
  }

  addPath(path: string) {
    const parts = path.split('.');
    let current = this.root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current.isLeaf) return; // Parent already includes everything
      
      if (!current.children.has(part)) {
        current.children.set(part, new FieldMaskNode());
      }
      current = current.children.get(part)!;
    }
    current.isLeaf = true;
    current.children.clear(); // Prune children as this node now includes all subfields
  }

  prune(data: any): any {
    return this.pruneNode(data, this.root);
  }

  private pruneNode(data: any, node: FieldMaskNode): any {
    if (node.isLeaf) return data;
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.pruneNode(item, node));
    }

    if (typeof data === 'object') {
      const result: any = {};
      for (const [key, childNode] of node.children.entries()) {
        if (key in data) {
          result[key] = this.pruneNode(data[key], childNode);
        }
      }
      return result;
    }

    return data; // Primitives are returned if their path isn't a leaf, though technically they shouldn't match. 
  }
}
