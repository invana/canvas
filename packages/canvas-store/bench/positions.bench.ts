/**
 * Phase 1 micro-benchmark — proves the typed-array hot lane. Each "op" is a full
 * sweep that rewrites **N node positions** (one layout tick). Compare:
 *
 *  - array-of-objects (`Map<id, {x,y}>`)  ← the naive baseline
 *  - `ColumnStore` direct slot writes      ← the hot lane, raw
 *  - `LayerData.positions` + touchPositions ← the hot lane through the kernel API
 *  - `LayerData.setPositionsBulk(ids, xy)`  ← the ergonomic bulk API
 *  - `LayerData.applyPositions([...])`       ← the object-iterable convenience path
 *
 * Run: `pnpm --filter @invana/canvas-store bench`
 */
import { bench, describe } from 'vitest';

import { ColumnStore, LayerData } from '../src/index';

const N = 50_000;

const ids: string[] = Array.from({ length: N }, (_, i) => `n${i}`);
// Interleaved [x0,y0,x1,y1,…] target buffer (precomputed; benches just copy it in).
const xy = new Float32Array(N * 2);
for (let i = 0; i < N * 2; i++) xy[i] = (i * 16807) % 100000;
const objPositions = Array.from({ length: N }, (_, i) => ({ id: ids[i]!, x: xy[i * 2]!, y: xy[i * 2 + 1]! }));

// ── baseline: array-of-objects ──────────────────────────────────────────────
const objMap = new Map<string, { x: number; y: number }>();
for (const id of ids) objMap.set(id, { x: 0, y: 0 });

// ── raw ColumnStore ─────────────────────────────────────────────────────────
const cs = new ColumnStore<{ x: 'f32'; y: 'f32' }>({ x: 'f32', y: 'f32' }, { initialCapacity: N });
for (const id of ids) cs.add(id, { x: 0, y: 0 });

// ── LayerData (manual flush — exclude scheduling from the measurement) ───────
const ld = new LayerData();
ld.setFlushMode('manual');
ld.setData({ nodes: ids.map((id) => ({ id })) });
ld.flush();
// Cache the hot-lane refs once (the renderer/layout fast-path pattern).
const xCol = ld.positions.column('x');
const yCol = ld.positions.column('y');
const slots = ids.map((id) => ld.positions.slot(id)!);

describe(`position rewrite @ ${N.toLocaleString()} nodes`, () => {
  bench('baseline — Map<id,{x,y}> object writes', () => {
    for (let i = 0; i < N; i++) {
      const p = objMap.get(ids[i]!)!;
      p.x = xy[i * 2]!;
      p.y = xy[i * 2 + 1]!;
    }
  });

  bench('ColumnStore — direct typed-array slot writes', () => {
    const x = cs.column('x');
    const y = cs.column('y');
    for (let i = 0; i < N; i++) {
      x[i] = xy[i * 2]!;
      y[i] = xy[i * 2 + 1]!;
    }
    cs.touch();
  });

  bench('LayerData.positions — direct slot writes + touchPositions()', () => {
    for (let i = 0; i < N; i++) {
      const s = slots[i]!;
      xCol[s] = xy[i * 2]!;
      yCol[s] = xy[i * 2 + 1]!;
    }
    ld.touchPositions();
    ld.flush();
  });

  bench('LayerData.setPositionsBulk(ids, interleaved Float32Array)', () => {
    ld.setPositionsBulk(ids, xy);
    ld.flush();
  });

  bench('LayerData.applyPositions([{id,x,y}, …]) — object iterable', () => {
    ld.applyPositions(objPositions);
    ld.flush();
  });
});
