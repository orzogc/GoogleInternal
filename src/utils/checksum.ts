// FNV-1a 32-bit hash implementation
export function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

// Stable stringify for objects (recursively sorts keys)
export function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return `[${obj.map(item => stableStringify(item)).join(',')}]`;
  }
  
  const keys = Object.keys(obj).sort();
  let result = '{';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] !== undefined) {
      if (i > 0) result += ',';
      result += JSON.stringify(key) + ':' + stableStringify(obj[key]);
    }
  }
  result += '}';
  return result;
}

/**
 * Calculates a content-based 32-bit hash of a JSON payload.
 * Field order is ignored, ensuring consistent IDs for identical data.
 */
export function calculateChecksum(payload: any): number {
  const stableStr = stableStringify(payload);
  return fnv1a32(stableStr);
}
