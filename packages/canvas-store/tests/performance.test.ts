import { describe, expect, it, vi } from 'vitest';

import {
  ColumnStore,
  DirtyBatcher,
  LayerData,
  createCanvasStore,
  select,
  type LayerFlush,
} from '../src/index';

/**
 * **Performance validation suite** — the Phase 1 gates (`canvas-store-migration-plan.md`).
 *
 * These assert the *structural invariants that guarantee* the performance, not raw
 * timings (those live in `bench/positions.bench.ts`). The few timing bounds here
 * are deliberately generous (≥10× headroom) so they validate the order of
 * magnitude without flaking under CI load.
 *
 * Gates (from `canvas-state-plan.md` §7):
 *  G1 one flush per frame regardless of write volume
 *  G2 targeted render — `moved` ≠ `changed`; full-graph move is O(1) (`movedAll`)
 *  G3 idle readers cost 0 (structural sharing + selector equality)
 *  G4 the data hot path is typed-array backed (no per-node objects)
 *  G5 per-frame work is O(unique changed), not O(writes)
 */

const microtask = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const nodeIds = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `n${i}` }));

// ── G1 — coalescing: one flush per frame ──────────────────────────────────────
describe('G1 · coalescing — one flush per frame regardless of write volume', () => {
  it('10k sync writes coalesce into exactly ONE microtask flush', async () => {
    const ld = new LayerData();
    let flushes = 0;
    let added = 0;
    ld.on('flush', (e) => {
      flushes++;
      added = e.nodes.added.length;
    });

    for (let i = 0; i < 10_000; i++) ld.addNode({ id: `n${i}` });
    expect(flushes).toBe(0); // nothing fired yet — JS can't run the microtask mid-loop

    await microtask();
    expect(flushes).toBe(1); // all 10k in ONE flush
    expect(added).toBe(10_000);
  });

  it('manual mode: writes never auto-fire; one flush() drains everything, empty after', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    let flushes = 0;
    ld.on('flush', () => flushes++);

    for (let i = 0; i < 50_000; i++) ld.addNode({ id: `n${i}` });
    expect(flushes).toBe(0);

    ld.flush();
    expect(flushes).toBe(1);

    ld.flush(); // nothing pending → no emission
    expect(flushes).toBe(1);
  });

  it('mixed-kind writes still coalesce into one flush', async () => {
    const ld = new LayerData();
    const listener = vi.fn();
    ld.on('flush', listener);
    for (let i = 0; i < 1000; i++) {
      ld.addNode({ id: `n${i}` });
      ld.addEdge({ id: `e${i}`, source: 'n0', target: `n${i}` });
    }
    expect(listener).not.toHaveBeenCalled();
    await microtask();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

// ── G2 — targeted render: moved ≠ changed, full-graph move is O(1) ─────────────
describe('G2 · targeted render — moved vs changed, movedAll is O(1)', () => {
  it('position-only update → moved (transform-only); structural update → changed', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    ld.addNode({ id: 'a' });
    ld.flush();
    const deltas: LayerFlush[] = [];
    ld.on('flush', (e) => deltas.push(e));

    ld.updateNode('a', { x: 1, y: 2 });
    ld.flush();
    expect(deltas[0]!.nodes.moved).toEqual(['a']);
    expect(deltas[0]!.nodes.changed).toEqual([]);
    expect(deltas[0]!.nodes.movedAll).toBe(false);

    ld.updateNode('a', { label: 'X' });
    ld.flush();
    expect(deltas[1]!.nodes.changed).toEqual(['a']);
    expect(deltas[1]!.nodes.moved).toEqual([]);
  });

  it('full-graph tick → movedAll=true with an EMPTY moved array (no N-id allocation)', () => {
    const N = 50_000;
    const ld = new LayerData();
    ld.setFlushMode('manual');
    ld.setData({ nodes: nodeIds(N) });
    ld.flush();

    let delta: LayerFlush | undefined;
    ld.on('flush', (e) => (delta = e));

    // direct-column fast path: write slots, then one O(1) touch
    const x = ld.positions.column('x');
    const y = ld.positions.column('y');
    for (let i = 0; i < N; i++) {
      x[i] = i;
      y[i] = i;
    }
    ld.touchPositions();
    ld.flush();

    expect(delta!.nodes.movedAll).toBe(true);
    // The load-bearing scale invariant: the kernel did NOT enumerate 50k ids.
    expect(delta!.nodes.moved.length).toBe(0);
  });

  it('add-then-remove before a flush is a net no-op (no wasted emission)', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    let flushes = 0;
    ld.on('flush', () => flushes++);
    ld.addNode({ id: 'x' });
    ld.removeNode('x');
    ld.flush();
    expect(flushes).toBe(0);
    expect(ld.counts.nodes).toBe(0);
  });
});

// ── G3 — idle readers cost 0 (structural sharing + selector equality) ──────────
describe('G3 · reactivity — idle readers cost 0', () => {
  it('a scoped selector does NOT wake on unrelated view changes', () => {
    const store = createCanvasStore();
    const layersSel = select(store.view, (s) => s.definition.layers);
    let wakes = 0;
    const off = layersSel.subscribe(() => wakes++);

    // mutate unrelated slices — many times
    store.actions.hover.set('n1');
    store.actions.camera.pan(10, 0);
    store.actions.selection.set(['a', 'b']);
    store.actions.layoutStatus.begin('force', true);
    store.actions.message.show('hi');
    expect(wakes).toBe(0); // idle layers reader never woke

    store.actions.layers.add('graph', {}); // now touch its slice
    expect(wakes).toBe(1); // exactly one wake
    off();
  });

  it('untouched subtrees keep referential identity across an update (the sharing that makes G3 work)', () => {
    const store = createCanvasStore();
    const before = store.view.getState();
    store.view.update((s) => {
      s.interaction.hover = 'n1';
    }, 'hover');
    const after = store.view.getState();

    expect(after).not.toBe(before); // new root
    expect(after.interaction).not.toBe(before.interaction); // touched → new ref
    expect(after.definition).toBe(before.definition); // untouched → SAME ref
    expect(after.runtime).toBe(before.runtime); // untouched → SAME ref
  });

  it('selector wakes are proportional to relevant changes only', () => {
    const store = createCanvasStore();
    const hoverSel = select(store.view, (s) => s.interaction.hover);
    let wakes = 0;
    hoverSel.subscribe(() => wakes++);

    store.actions.hover.set('a'); // relevant
    store.actions.hover.set('b'); // relevant
    store.actions.camera.zoom(2); // irrelevant
    store.actions.layers.add('g', {}); // irrelevant
    store.actions.hover.set('b'); // same value → equal → no wake

    expect(wakes).toBe(2);
  });
});

// ── G4 — the data hot path is typed-array backed ──────────────────────────────
describe('G4 · hot lane — positions are typed-array backed, not per-node objects', () => {
  it('node positions live in a Float32Array; direct slot writes reflect through node()', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    ld.addNode({ id: 'a', x: 5, y: 6 });

    expect(ld.positions.column('x')).toBeInstanceOf(Float32Array);
    expect(ld.positions.column('y')).toBeInstanceOf(Float32Array);

    const slot = ld.positions.slot('a')!;
    ld.positions.column('x')[slot] = 42;
    ld.positions.column('y')[slot] = 43;
    ld.touchPositions();

    expect(ld.node('a')).toMatchObject({ x: 42, y: 43 });
  });

  it('a node without a position reads back without x/y (HAS_POSITION bit gates the stitch)', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    ld.addNode({ id: 'a', label: 'A' });
    const n = ld.node('a')!;
    expect(n.label).toBe('A');
    expect(n.x).toBeUndefined();
    expect(n.y).toBeUndefined();
  });

  it('setPositionsBulk applies an interleaved buffer and marks those ids moved', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    ld.setData({ nodes: nodeIds(3) });
    ld.flush();
    let delta: LayerFlush | undefined;
    ld.on('flush', (e) => (delta = e));

    ld.setPositionsBulk(['n0', 'n1', 'n2'], new Float32Array([0, 0, 10, 20, 30, 40]));
    ld.flush();

    expect(delta!.nodes.moved.sort()).toEqual(['n0', 'n1', 'n2']);
    expect(ld.node('n1')).toMatchObject({ x: 10, y: 20 });
    expect(ld.node('n2')).toMatchObject({ x: 30, y: 40 });
  });
});

// ── ColumnStore — scale + grow + version ──────────────────────────────────────
describe('ColumnStore · scales, grows, and version-tracks', () => {
  it('bulk add to 100k grows without losing data', () => {
    const cs = new ColumnStore<{ x: 'f32'; y: 'f32' }>({ x: 'f32', y: 'f32' }, { initialCapacity: 4 });
    const items = Array.from({ length: 100_000 }, (_, i) => ({ id: `n${i}`, row: { x: i, y: -i } }));
    cs.addBulk(items);

    expect(cs.size).toBe(100_000);
    expect(cs.capacity).toBeGreaterThanOrEqual(100_000);
    expect(cs.get('n0', 'x')).toBe(0);
    expect(cs.get('n99999', 'y')).toBe(-99999); // integers ≤ 2^24 are exact in f32
  });

  it('version bumps once per mutation/touch — subscribers diff this, not deep-compare', () => {
    const cs = new ColumnStore<{ x: 'f32' }>({ x: 'f32' });
    cs.add('a', { x: 0 });
    const v = cs.version;
    cs.column('x')[cs.slot('a')!] = 9;
    cs.touch();
    expect(cs.version).toBe(v + 1);
  });

  it('recycles slots under churn so buffers stay compact', () => {
    const cs = new ColumnStore<{ x: 'f32' }>({ x: 'f32' }, { initialCapacity: 8 });
    for (let i = 0; i < 8; i++) cs.add(`n${i}`, { x: i });
    const capBefore = cs.capacity;
    for (let i = 0; i < 8; i++) cs.remove(`n${i}`);
    for (let i = 0; i < 8; i++) cs.add(`m${i}`, { x: i }); // reuse freed slots
    expect(cs.size).toBe(8);
    expect(cs.capacity).toBe(capBefore); // no growth — slots recycled
  });
});

// ── G5 — DirtyBatcher: per-frame work is O(unique changed), not O(writes) ──────
describe('G5 · DirtyBatcher — O(unique changed), double-buffered', () => {
  it('dedupes N marks of the same id into one entry', () => {
    const b = new DirtyBatcher<'node'>();
    for (let i = 0; i < 10_000; i++) b.mark('node', 'same');
    const snap = b.flush();
    expect([...(snap.buckets.get('node') ?? [])]).toEqual(['same']);
  });

  it('marks made during a flush land in the NEXT frame (no mutation-during-iteration)', () => {
    const b = new DirtyBatcher<'node'>();
    b.mark('node', 'a');
    b.flush();
    b.mark('node', 'b');
    const snap = b.flush();
    expect([...(snap.buckets.get('node') ?? [])]).toEqual(['b']);
  });

  it('markAll signals a whole-bucket rebuild without enumerating ids', () => {
    const b = new DirtyBatcher<'node'>();
    b.markAll('node');
    const snap = b.flush();
    expect(snap.rebuildAll.has('node')).toBe(true);
    expect(snap.buckets.get('node')?.size ?? 0).toBe(0); // not enumerated
  });
});

// ── Throughput sanity (generous bounds; the real numbers live in the bench) ────
describe('throughput sanity — order-of-magnitude bounds (≥10× headroom)', () => {
  it('1M direct typed-array slot writes complete well under 200ms', () => {
    const N = 1_000_000;
    const cs = new ColumnStore<{ x: 'f32' }>({ x: 'f32' }, { initialCapacity: N });
    for (let i = 0; i < N; i++) cs.add(`n${i}`, { x: 0 });
    const col = cs.column('x');

    const t0 = performance.now();
    for (let i = 0; i < N; i++) col[i] = i;
    cs.touch();
    const ms = performance.now() - t0;

    expect(ms).toBeLessThan(200); // actual is ~1–5ms — this only catches catastrophic regressions
  });

  it('the typed-array path is dramatically faster than array-of-objects at 50k', () => {
    const N = 50_000;
    const ids = Array.from({ length: N }, (_, i) => `n${i}`);

    const objMap = new Map<string, { x: number; y: number }>();
    for (const id of ids) objMap.set(id, { x: 0, y: 0 });
    const t0 = performance.now();
    for (let r = 0; r < 10; r++) for (let i = 0; i < N; i++) {
      const p = objMap.get(ids[i]!)!;
      p.x = i;
      p.y = i;
    }
    const objMs = performance.now() - t0;

    const cs = new ColumnStore<{ x: 'f32'; y: 'f32' }>({ x: 'f32', y: 'f32' }, { initialCapacity: N });
    for (const id of ids) cs.add(id, { x: 0, y: 0 });
    const x = cs.column('x');
    const y = cs.column('y');
    const t1 = performance.now();
    for (let r = 0; r < 10; r++) for (let i = 0; i < N; i++) {
      x[i] = i;
      y[i] = i;
    }
    cs.touch();
    const colMs = performance.now() - t1;

    // bench shows ~26×; assert ≥3× so the gate validates the win without flaking.
    expect(colMs * 3).toBeLessThan(objMs);
  });
});
