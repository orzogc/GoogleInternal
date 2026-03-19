import { z } from 'zod';
import { ServiceConfig, Spec } from '../types';
import * as AuthModule from '../auth';
import * as Transport from '../transport';
import { FieldMaskTree } from '../utils/field-mask';
import { calculateChecksum } from '../utils/checksum';
import { QUERY_PARAMS } from '../constants';

export class Service {
  private specs: Map<string, Spec<any, any>> = new Map();
  public lastChecksums: Map<string, number> = new Map();

  constructor(public config: ServiceConfig) {}

  register<TSchema extends z.ZodTypeAny, TResult>(name: string, spec: Spec<TSchema, TResult>) {
    this.specs.set(name, spec);
  }

  getSpec(name: string): Spec<any, any> | undefined {
    return this.specs.get(name);
  }

  private applyConfigToUrl(url: URL) {
    if (this.config.hl) url.searchParams.append('hl', this.config.hl);
    if (this.config.bl) url.searchParams.append('bl', this.config.bl);
    if (this.config.f_sid) url.searchParams.append('f.sid', this.config.f_sid);
    
    if (this.config.fields && this.config.fields.length > 0) {
      url.searchParams.append(QUERY_PARAMS.FIELDS[0], this.config.fields.join(','));
    }
    if (this.config.prettyPrint) {
      url.searchParams.append(QUERY_PARAMS.PRETTY_PRINT[0], 'true');
    }
    if (this.config.errorFormat) {
      url.searchParams.append(QUERY_PARAMS.ERROR_FORMAT[0], this.config.errorFormat);
    }
    if (this.config.alt) {
      url.searchParams.append(QUERY_PARAMS.ALT[0], this.config.alt);
    }
  }

  private processResultData<TResult>(specName: string, data: any): TResult {
    let result = data;
    
    // Prune data via FieldMask Tree
    if (this.config.fields && this.config.fields.length > 0) {
      const tree = new FieldMaskTree(this.config.fields);
      result = tree.prune(result);
    }

    // Canonical Content Hash
    if (this.config.checksum) {
      const checksum = calculateChecksum(result);
      this.lastChecksums.set(specName, checksum);
      // Attach non-enumerable checksum if possible
      if (result && typeof result === 'object') {
        Object.defineProperty(result, '__checksum', {
          value: checksum,
          enumerable: false
        });
      }
    }

    return result as TResult;
  }

  async execute<TResult = any>(name: string, data: any): Promise<TResult> {
    const spec = this.specs.get(name);
    if (!spec) {
      throw new Error(`Spec not found: ${name}`);
    }

    const validatedData = spec.schema ? spec.schema.parse(data) : data;
    const args = spec.mapArgs(validatedData);
    const body = Transport.encodeBatch([{ rpcId: spec.rpcId, args }]);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    };

    if (this.config.cookies && this.config.origin) {
      const cookies = AuthModule.parseCookies(this.config.cookies, ['SAPISID']);
      if (cookies.SAPISID) {
        headers['Authorization'] = `SAPISIDHASH ${AuthModule.generateSapisidHash(cookies.SAPISID, this.config.origin)}`;
      }
      headers['Cookie'] = this.config.cookies;
    }

    const params = new URLSearchParams();
    params.append('f.req', body);
    if (this.config.at) {
      params.append('at', this.config.at);
    }

    const url = new URL(this.config.baseUrl);
    this.applyConfigToUrl(url);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    const allResults = Transport.decodeResponse(responseText);
    const result = allResults.find(r => r.rpcId === spec.rpcId);

    if (!result) {
      throw new Error(`No result found for rpcId: ${spec.rpcId}`);
    }

    const mappedResult = spec.mapResult(result.payload);
    return this.processResultData<TResult>(name, mappedResult);
  }

  async *stream<TSchema extends z.ZodTypeAny = any, TResult = any>(name: string, data: any): AsyncIterable<TResult> {
    const spec = this.specs.get(name);
    if (!spec) {
      throw new Error(`Spec not found: ${name}`);
    }

    const validatedData = spec.schema ? spec.schema.parse(data) : data;
    const args = spec.mapArgs(validatedData);
    const body = Transport.encodeBatch([{ rpcId: spec.rpcId, args }]);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    };

    if (this.config.cookies && this.config.origin) {
      const cookies = AuthModule.parseCookies(this.config.cookies, ['SAPISID']);
      if (cookies.SAPISID) {
        headers['Authorization'] = `SAPISIDHASH ${AuthModule.generateSapisidHash(cookies.SAPISID, this.config.origin)}`;
      }
      headers['Cookie'] = this.config.cookies;
    }

    const params = new URLSearchParams();
    params.append('f.req', body);
    if (this.config.at) {
      params.append('at', this.config.at);
    }

    const url = new URL(this.config.baseUrl);
    this.applyConfigToUrl(url);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const decoder = new Transport.StreamingDecoder();
    const stream = (response.body as any).pipeThrough(new TextDecoderStream());

    for await (const chunk of stream) {
      const results = decoder.decodeChunk(chunk);
      for (const result of results) {
        if (result.rpcId === spec.rpcId) {
          const mappedResult = spec.mapResult(result.payload);
          yield this.processResultData<TResult>(name, mappedResult);
        }
      }
    }
  }
}
