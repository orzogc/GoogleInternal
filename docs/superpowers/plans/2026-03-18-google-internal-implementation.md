# GoogleInternal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js/TypeScript library to interact with Google's internal `batchexecute` RPC protocol with a declarative Spec Registry and SAPISIDHASH support.

**Architecture:** Modular design with a low-level Transport layer for protocol details and a high-level Service layer for developer-friendly API calls. Includes a centralized Spec Registry for mapping RPC IDs to JSON objects.

**Tech Stack:** TypeScript, Node.js (v18+ for native fetch), Crypto (built-in).

---

### Task 1: Project Initialization & Basic Types

**Files:**
- Create: `package.json`, `tsconfig.json`, `src/types/index.ts`
- Test: N/A (Project setup)

- [ ] **Step 1: Initialize project and install dependencies**
Run: `npm init -y && npm install -D typescript ts-node vitest @types/node`

- [ ] **Step 2: Define core interfaces**
```typescript
// src/types/index.ts
export interface ServiceConfig {
  baseUrl: string;
  hl?: string;
  bl?: string;
  f_sid?: string;
  at?: string;
}

export interface Spec {
  rpcId: string;
  mapArgs: (data: any) => any[];
  mapResult: (arr: any[]) => any;
}
```

- [ ] **Step 3: Commit**
```bash
git add package.json tsconfig.json src/types/index.ts
git commit -m "chore: initialize project and core types"
```

---

### Task 2: Auth Module - SAPISIDHASH & Cookies

**Files:**
- Create: `src/auth/hashing.ts`, `src/auth/cookies.ts`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Implement SAPISIDHASH generation**
```typescript
// src/auth/hashing.ts
import { createHash } from 'crypto';

export function generateSapisidHash(sapisid: string, origin: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp} ${sapisid} ${origin}`;
  const hash = createHash('sha1').update(payload).digest('hex');
  return `${timestamp}_${hash}`;
}
```

- [ ] **Step 2: Write test for hashing**
- [ ] **Step 3: Implement cookie parser**
- [ ] **Step 4: Commit**
```bash
git add src/auth/ tests/auth.test.ts
git commit -m "feat: implement SAPISIDHASH and cookie parsing"
```

---

### Task 3: Transport Layer - f.req Encoding

**Files:**
- Create: `src/transport/encoder.ts`
- Test: `tests/encoder.test.ts`

- [ ] **Step 1: Write failing test for f.req encoding**
- [ ] **Step 2: Implement encodeBatch function**
```typescript
// src/transport/encoder.ts
export function encodeBatch(calls: { rpcId: string, args: any[] }[]): string {
  const payload = calls.map(c => [c.rpcId, JSON.stringify(c.args), null, "generic"]);
  return JSON.stringify([[payload]]);
}
```
- [ ] **Step 3: Verify double-encoding for arguments**
- [ ] **Step 4: Commit**

---

### Task 4: Transport Layer - Response Decoding (wrb.fr)

**Files:**
- Create: `src/transport/decoder.ts`
- Test: `tests/decoder.test.ts`

- [ ] **Step 1: Implement XSSI prefix stripping**
- [ ] **Step 2: Implement length-prefixed chunk parsing**
- [ ] **Step 3: Implement wrb.fr envelope extraction**
- [ ] **Step 4: Commit**

---

### Task 5: Service & Spec Registry

**Files:**
- Create: `src/registry/service.ts`, `src/registry/spec.ts`, `src/index.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: Implement Service class with register() and execute()**
- [ ] **Step 2: Implement GoogleInternal main client**
- [ ] **Step 3: Commit**

---

### Task 6: Batch Chaining & Error Handling

**Files:**
- Create: `src/batch/builder.ts`, `src/errors/index.ts`
- Test: `tests/batch.test.ts`

- [ ] **Step 1: Implement BatchBuilder**
- [ ] **Step 2: Implement PartialBatchError handling**
- [ ] **Step 3: Commit**
