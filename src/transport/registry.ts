import { WKT_URLS } from '../constants';

export type Renderer = (data: any) => any;

export class WKTRegistry {
  private renderers: Map<string, Renderer> = new Map();

  constructor() {
    this.registerDefaultRenderers();
  }

  register(typeUrl: string, renderer: Renderer) {
    this.renderers.set(typeUrl, renderer);
  }

  get(typeUrl: string): Renderer | undefined {
    return this.renderers.get(typeUrl);
  }

  private registerDefaultRenderers() {
    // Timestamp -> JS Date
    this.register(WKT_URLS.TIMESTAMP, (data: any) => {
      if (typeof data === 'string') return new Date(data); // Pre-formatted ISO
      if (data && data.seconds) {
        const ms = parseInt(data.seconds, 10) * 1000 + (data.nanos ? Math.floor(data.nanos / 1e6) : 0);
        return new Date(ms);
      }
      return data;
    });

    // Duration -> Milliseconds
    this.register(WKT_URLS.DURATION, (data: any) => {
      if (typeof data === 'string' && data.endsWith('s')) {
        return parseFloat(data.slice(0, -1)) * 1000;
      }
      if (data && data.seconds) {
        return parseInt(data.seconds, 10) * 1000 + (data.nanos ? Math.floor(data.nanos / 1e6) : 0);
      }
      return data;
    });

    // ListValue -> JS Array
    this.register(WKT_URLS.LIST_VALUE, (data: any) => {
      if (data && Array.isArray(data.values)) {
        return data.values.map((v: any) => this.transform(v));
      }
      return Array.isArray(data) ? data : [];
    });

    // Struct -> JS Object
    this.register(WKT_URLS.STRUCT, (data: any) => {
      if (data && data.fields && typeof data.fields === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(data.fields)) {
          result[key] = this.transform(value);
        }
        return result;
      }
      return data;
    });

    // Value -> JS Primitive
    this.register(WKT_URLS.VALUE, (data: any) => {
      if (!data || typeof data !== 'object') return data;
      if ('nullValue' in data) return null;
      if ('numberValue' in data) return data.numberValue;
      if ('stringValue' in data) return data.stringValue;
      if ('boolValue' in data) return data.boolValue;
      if ('structValue' in data) return this.transform(data.structValue);
      if ('listValue' in data) return this.transform(data.listValue);
      return data;
    });

    // Standard Wrappers (DoubleValue, FloatValue, Int64Value, etc.)
    const wrapperTypes = [
      'google.protobuf.DoubleValue', 'google.protobuf.FloatValue', 
      'google.protobuf.Int64Value', 'google.protobuf.UInt64Value',
      'google.protobuf.Int32Value', 'google.protobuf.UInt32Value', 
      'google.protobuf.BoolValue', 'google.protobuf.StringValue', 
      'google.protobuf.BytesValue'
    ];
    for (const type of wrapperTypes) {
      this.register(`type.googleapis.com/${type}`, (data: any) => {
        return data && data.value !== undefined ? data.value : data;
      });
    }

    // Any -> Unwrap and decode
    this.register(WKT_URLS.ANY, (data: any) => {
      if (data && data['@type']) {
        const renderer = this.get(data['@type']);
        if (renderer) {
          return renderer(data);
        }
      }
      return data; // Return raw if no specific renderer found
    });
  }

  /**
   * Recursively applies renderers to a JSON object containing WKT definitions.
   */
  transform(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.transform(item));
    }

    // Check if it's an 'Any' typed object
    if (data['@type']) {
      const renderer = this.get(data['@type']);
      if (renderer) {
        const rendered = renderer(data);
        // If the renderer unpacked it entirely, return it.
        if (rendered !== data && !(rendered && typeof rendered === 'object' && rendered['@type'])) {
           return rendered; 
        }
      }
    }

    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = this.transform(data[key]);
    }
    return result;
  }
}

export const defaultRegistry = new WKTRegistry();
