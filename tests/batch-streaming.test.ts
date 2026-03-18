import { describe, it, expect, vi } from 'vitest';
import { GoogleInternal } from '../src';

describe('Batch Streaming API', () => {
  it('should stream multiple RPC results correctly', async () => {
    const client = new GoogleInternal({ baseUrl: 'https://example.com' });
    const service = client.registerService('service', { baseUrl: 'https://example.com/s' });

    service.register('rpc1', {
      rpcId: 'rpc1_id',
      mapArgs: (data: any) => [data.id],
      mapResult: (payload: any) => payload[0],
    });

    service.register('rpc2', {
      rpcId: 'rpc2_id',
      mapArgs: (data: any) => [data.name],
      mapResult: (payload: any) => payload[1],
    });

    const response1 = JSON.stringify([["wrb.fr", "rpc1_id", "[\"result1\"]", null, null, null, "1"]]);
    const response2 = JSON.stringify([["wrb.fr", "rpc2_id", "[null, \"result2\"]", null, null, null, "2"]]);

    const chunks = [
      ")]}'\n",
      `${response1.length}\n${response1}\n`,
      `${response2.length}\n${response2}\n`
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      }
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream
    });

    const batch = client.newBatch();
    batch.add('service', 'rpc1', { id: 1 });
    batch.add('service', 'rpc2', { name: 'test' });

    const results: any[] = [];
    // @ts-ignore - stream() not implemented yet
    for await (const result of batch.stream()) {
      results.push(result);
    }

    expect(results).toEqual(['result1', 'result2']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle partial failure scenarios gracefully', async () => {
     // Scenario: stream completes but some items didn't return a result
     // In this case, stream() just ends without yielding missing results
     // but we can test if it yields what it DID get
     const client = new GoogleInternal({ baseUrl: 'https://example.com' });
     const service = client.registerService('service', { baseUrl: 'https://example.com/s' });

     service.register('rpc1', {
       rpcId: 'rpc1_id',
       mapArgs: (data: any) => [data.id],
       mapResult: (payload: any) => payload[0],
     });

     service.register('rpc2', {
       rpcId: 'rpc2_id',
       mapArgs: (data: any) => [data.name],
       mapResult: (payload: any) => payload[1],
     });

     const response1 = JSON.stringify([["wrb.fr", "rpc1_id", "[\"result1\"]", null, null, null, "1"]]);

     const chunks = [
       ")]}'\n",
       `${response1.length}\n${response1}\n`
     ];

     const stream = new ReadableStream({
       start(controller) {
         for (const chunk of chunks) {
           controller.enqueue(new TextEncoder().encode(chunk));
         }
         controller.close();
       }
     });

     global.fetch = vi.fn().mockResolvedValue({
       ok: true,
       body: stream
     });

     const batch = client.newBatch();
     batch.add('service', 'rpc1', { id: 1 });
     batch.add('service', 'rpc2', { name: 'test' });

     const results: any[] = [];
     // @ts-ignore
     for await (const result of batch.stream()) {
       results.push(result);
     }

     expect(results).toEqual(['result1']);
  });
});
