import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Service } from '../src/registry/service';
import { Spec } from '../src/types';

describe('Schema Validation', () => {
  const mockConfig = { baseUrl: 'https://example.com' };

  it('should validate data against schema and pass parsed data to mapArgs', async () => {
    const service = new Service(mockConfig);
    const schema = z.object({
      id: z.string(),
      count: z.number().int(),
    });

    const spec: Spec<typeof schema, { success: boolean }> = {
      rpcId: 'testRpcId',
      schema,
      mapArgs: (data) => {
        // Inferred type should be { id: string, count: number }
        return [data.id, data.count];
      },
      mapResult: (arr) => ({ success: arr[0] === 'ok' }),
    };

    service.register('test', spec);

    // Mock global fetch
    const mockResponse = {
      ok: true,
      text: async () => {
        const payload = '[["wrb.fr","testRpcId","[\\"ok\\"]",null,null,null,"1"]]';
        return `)]}'\n${payload.length}\n${payload}`;
      },
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await service.execute('test', { id: '123', count: 5 });

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should throw Zod error for invalid data', async () => {
    const service = new Service(mockConfig);
    const schema = z.object({
      id: z.string(),
    });

    const spec: Spec<typeof schema> = {
      rpcId: 'testRpcId',
      schema,
      mapArgs: (data) => [data.id],
      mapResult: (arr) => arr,
    };

    service.register('test', spec);

    await expect(service.execute('test', { id: 123 })).rejects.toThrow();
  });
});
