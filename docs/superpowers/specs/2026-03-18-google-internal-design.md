# Design Spec: GoogleInternal Node.js Library

## 1. Overview
`GoogleInternal` is a Node.js library designed to simplify interaction with Google's internal `batchexecute` RPC protocol. It provides a declarative way to define RPC specs, handles complex authentication (SAPISIDHASH), and supports batching multiple requests with custom metadata.

## 2. Architecture

### 2.1 Transport Layer (Internal)
The low-level engine that handles the raw protocol details:
- **Encoder:** Transforms high-level RPC calls into the nested `f.req` array format.
- **Decoder:** Handles the `)]}'` prefix, length-prefixed chunks, and the `wrb.fr` envelope.
- **HTTP Client:** Executes the POST request with the correct `Content-Type`, `at` token, and `SAPISIDHASH` headers.

### 2.2 Auth & Metadata Module
- **Cookie Manager:** Parses and stores session cookies.
- **Header Generator:** Produces the `Authorization` header with `SAPISIDHASH`.
- **CSRF Token Management:** Handles the `at` token required for all non-GET requests. The library should attempt to extract this from cookies or initial page loads if not provided.
- **Token Extractor:** Logic to find `at` and `f.sid` tokens (initially manual, eventually automated).

### 2.3 Service & Spec Registry (Public API)
- **Service Registry:** Groups RPCs by application (e.g., 'news', 'drive') with shared `baseUrl`, `hl`, and `bl`.
- **Spec Registry:** Defines the `rpcId` and transformation functions (mapping JSON to/from positional arrays).

## 3. Error Handling
- **Network Errors:** Standard retry logic for 5xx responses.
- **Auth Errors:** Specific exceptions for 401/403 (expired session/invalid SAPISIDHASH).
- **Partial Batch Failures:** In a batch request, some RPCs may succeed while others fail. The library must parse each `wrb.fr` envelope independently and return a result object that identifies which calls failed (e.g. via an `error` field in the mapped result).
- **Protocol Errors:** Handle cases where the response does not follow the expected `wrb.fr` or chunked format.

## 4. Usage Flow
1. **Setup:** `const client = new GoogleInternal({ cookies: '...' });`
2. **Define Service:** 
   ```javascript
   const news = client.registerService('news', { baseUrl: '...' });
   news.register('search', { rpcId: 'vYbt6d', ... });
   ```
3. **Call:** `const results = await news.execute('search', { query: 'technology' });`
4. **Batch:** 
   ```javascript
   const batch = client.newBatch();
   batch.add('news', 'search', { query: 'AI' });
   batch.add('news', 'topStories', {});
   const [searchRes, topRes] = await batch.execute();
   ```

## 4. Technical Implementation Details
- **Hashing:** Use Node's built-in `crypto` for SHA-1.
- **HTTP Client:** Use `fetch` (native in Node 18+) or `axios`.
- **Encoding:** Stringified JSON arrays (double-encoding) as per `batchexecute` requirements.

## 5. Success Criteria
- Successfully generates valid `SAPISIDHASH`.
- Correctly encodes and decodes `f.req` and `wrb.fr` envelopes.
- Supports batching multiple independent RPCs in one request.
