/**
 * Vitest benchmark suite for `GraphStore`.
 *
 * Run via `pnpm --filter @invana/graph bench`. Each `bench()` block runs many
 * iterations and reports throughput + p99 from vitest's tinybench backend.
 *
 * The performance targets from `apps/docs/graph/store-plan.md` are documented
 * as comments next to each bench — vitest doesn't fail-on-target by default,
 * but the reported numbers should be inspected and stored in CI artifacts.
 */
import { bench, describe } from 'vitest';

import { GraphStore } from '../../src/store';

const N = 100_000;
const E = 500_000;

describe('GraphStore.addNode', () => {
  // Target: p50 < 1 µs.
  bench('addNode single', () => {
    const store = new GraphStore({ initialCapacity: 4096 });
    for (let i = 0; i < 1_000; i++) store.addNode({ type: 'node', id: `n-${i}` });
  });
});

describe('GraphStore.addEdge', () => {
  // Target: p50 < 1 µs.
  bench('addEdge single', () => {
    const store = new GraphStore({ initialCapacity: 4096 });
    for (let i = 0; i < 1_000; i++) store.addNode({ type: 'node', id: `n-${i}` });
    for (let i = 0; i < 1_000; i++) {
      store.addEdge({ type: 'edge', id: `e-${i}`, source: `n-${i % 1_000}`, target: `n-${(i + 1) % 1_000}` });
    }
  });
});

describe('GraphStore bulk insert', () => {
  // Target: addNodesBulk(100k) < 50 ms.
  bench('addNodesBulk(100k)', () => {
    const store = new GraphStore({ initialCapacity: N });
    const nodes = Array.from({ length: N }, (_, i) => ({ id: `n-${i}`, type: 'node' }));
    store.addNodesBulk(nodes);
  });

  // Target: addEdgesBulk(500k) < 250 ms.
  bench(
    'addEdgesBulk(500k) on 100k nodes',
    () => {
      const store = new GraphStore({ initialCapacity: N });
      store.addNodesBulk(Array.from({ length: N }, (_, i) => ({ id: `n-${i}`, type: 'node' })));
      const edges = Array.from({ length: E }, (_, i) => ({
        id: `e-${i}`,
        type: 'edge',
        source: `n-${i % N}`,
        target: `n-${(i * 7) % N}`,
      }));
      store.addEdgesBulk(edges);
    },
    { iterations: 5 },
  );
});

describe('GraphStore.neighborsOf', () => {
  // Target: first-neighbor < 50 ns amortized.
  const store = new GraphStore({ initialCapacity: N });
  store.addNodesBulk(Array.from({ length: N }, (_, i) => ({ id: `n-${i}`, type: 'node' })));
  store.addEdgesBulk(
    Array.from({ length: E }, (_, i) => ({
      id: `e-${i}`,
      type: 'edge',
      source: `n-${i % N}`,
      target: `n-${(i * 7919) % N}`,
    })),
  );
  const startIds = Array.from({ length: 1_000_000 }, (_, i) => `n-${(i * 1009) % N}`);

  bench('1M neighbor first-hit lookups', () => {
    for (let i = 0; i < startIds.length; i++) {
      for (const _ of store.neighborsOf(startIds[i]!, 'out')) break;
    }
  });
});

describe('GraphStore.setPositionsBulk (sim tick)', () => {
  // Target: per call < 5 ms for 100k nodes.
  const store = new GraphStore({ initialCapacity: N });
  store.addNodesBulk(Array.from({ length: N }, (_, i) => ({ id: `n-${i}`, type: 'node' })));
  const ids = Array.from({ length: N }, (_, i) => `n-${i}`);
  const xy = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    xy[i * 2] = i * 0.01;
    xy[i * 2 + 1] = i * 0.02;
  }

  bench('setPositionsBulk(100k) silent', () => {
    store.setPositionsBulk(ids, xy, { silent: true });
  });
});

describe('GraphStore.removeNode (cascade)', () => {
  // Target: < 100 µs at avg deg ≈ 10.
  bench('cascade-remove 1k nodes from 10k-node graph', () => {
    const store = new GraphStore({ initialCapacity: 10_000 });
    store.addNodesBulk(Array.from({ length: 10_000 }, (_, i) => ({ id: `n-${i}`, type: 'node' })));
    store.addEdgesBulk(
      Array.from({ length: 50_000 }, (_, i) => ({
        id: `e-${i}`,
        type: 'edge',
        source: `n-${i % 10_000}`,
        target: `n-${(i * 7) % 10_000}`,
      })),
    );
    for (let i = 0; i < 1_000; i++) store.removeNode(`n-${(i * 11) % 10_000}`);
  });
});

describe('GraphStore.batch', () => {
  bench('1k inserts via batch (1 flush)', () => {
    const store = new GraphStore();
    store.batch(() => {
      for (let i = 0; i < 1_000; i++) store.addNode({ type: 'node', id: `n-${i}` });
    });
  });

  bench('1k inserts sync (1k flushes)', () => {
    const store = new GraphStore();
    for (let i = 0; i < 1_000; i++) store.addNode({ type: 'node', id: `n-${i}` });
  });
});

describe('GraphStore streaming (flushMode:frame)', () => {
  // 60 frames × 166 muts/frame ≈ 10k mut/sec. Target: per-call < 1ms ideally.
  bench(
    '60 frames @ 166 muts/frame (flushMode:frame)',
    () => {
      const store = new GraphStore({ flushMode: 'frame', initialCapacity: 16_000 });
      let id = 0;
      for (let f = 0; f < 60; f++) {
        for (let i = 0; i < 166; i++) {
          const nodeId = `n-${id++}`;
          store.upsertNode({ type: 'node', id: nodeId, position: { x: i, y: f } });
          if (id > 1) {
            store.upsertEdge({ type: 'edge', id: `e-${id}`, source: `n-${id - 2}`, target: nodeId });
          }
        }
        store.flush();
      }
    },
    { iterations: 5 },
  );
});

describe('GraphStore out-of-order edges (unknownEndpoint:buffer)', () => {
  // Target: admit latency < 5 µs/edge.
  bench(
    'park 10k edges + arrive 20k nodes',
    () => {
      const store = new GraphStore({ unknownEndpoint: 'buffer', initialCapacity: 20_000 });
      for (let i = 0; i < 10_000; i++) {
        store.addEdge({ type: 'edge', id: `e-${i}`, source: `s-${i}`, target: `t-${i}` });
      }
      for (let i = 0; i < 10_000; i++) {
        store.addNode({ type: 'node', id: `s-${i}` });
        store.addNode({ type: 'node', id: `t-${i}` });
      }
    },
    { iterations: 5 },
  );
});
