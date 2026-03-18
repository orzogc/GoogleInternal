import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleInternal } from '../src/index';
import { Service } from '../src/registry/service';

// Mock fetch
global.fetch = vi.fn();

describe('Service & Spec Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a service and a spec, and execute it', async () => {
    const client = new GoogleInternal({
      baseUrl: 'https://news.google.com',
      at: 'test-at'
    });

    const newsService = client.registerService('news', {
      baseUrl: 'https://news.google.com/_/NewsBackend'
    });

    const searchSpec = {
      rpcId: 'vYbt6d',
      mapArgs: (data: { query: string }) => [data.query, 10],
      mapResult: (arr: any[]) => ({ results: arr[0] })
    };

    newsService.register('search', searchSpec);

    // Mock response
    const payload = "[[\"wrb.fr\",\"vYbt6d\",\"[\\\"result-data\\\"]\",null,\"generic\"]]";
    const mockResponse = `)]}'\n${payload.length}\n${payload}\n`;
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockResponse)
    });

    const result = await newsService.execute('search', { query: 'technology' });

    expect(result).toEqual({ results: 'result-data' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://news.google.com/_/NewsBackend'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }),
        body: expect.stringContaining('f.req=')
      })
    );
  });

  it('should include SAPISIDHASH if cookies are provided', async () => {
    const client = new GoogleInternal({
      baseUrl: 'https://news.google.com',
      cookies: 'SAPISID=test-sapisid; HSID=test-hsid',
      origin: 'https://news.google.com'
    });

    const newsService = client.registerService('news', {
      baseUrl: 'https://news.google.com/_/NewsBackend'
    });

    newsService.register('test', {
      rpcId: 'testRpc',
      mapArgs: (data) => [data],
      mapResult: (arr) => arr
    });

    const payload = "[[\"wrb.fr\",\"testRpc\",\"[]\",null,\"generic\"]]";
    const mockResponse = `)]}'\n${payload.length}\n${payload}\n`;
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockResponse)
    });

    await newsService.execute('test', 'data');

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.Authorization).toBeDefined();
    expect(headers.Authorization).toMatch(/^SAPISIDHASH \d+_[a-f0-9]+$/);
  });
});
