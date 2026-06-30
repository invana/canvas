import { describe, expect, it } from 'vitest';

import { DataStore, type FlushEvent } from '../../src/data/DataStore';
import { LayerData } from '../../src/data/LayerData';

/** Resolve after the flush microtask. */
const tick = (): Promise<void> => Promise.resolve();
/** Resolve after a macrotask — long enough for a real rAF (browser) or the microtask fallback (node). */
const macro = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('FlushMode', () => {
  it("default 'microtask' defers, then auto-flushes one coalesced delta", async () => {
    const ds = new DataStore();
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));

    ds.upsert({ id: 'a' });
    ds.upsert({ id: 'b' });
    expect(seen).toHaveLength(0); // deferred — not fired synchronously

    await tick();
    expect(seen).toHaveLength(1); // one flush for the whole batch
    expect(seen[0]!.added.sort()).toEqual(['a', 'b']);
  });

  it("'manual' never auto-flushes — only flush() emits", async () => {
    const ds = new DataStore();
    ds.setFlushMode('manual');
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));

    ds.upsert({ id: 'a' });
    ds.upsert({ id: 'b' });
    await tick();
    await macro(10);
    expect(seen).toHaveLength(0); // still nothing — no auto-trigger

    ds.flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.added.sort()).toEqual(['a', 'b']);
  });

  it("switching to 'manual' disarms a pending auto-flush", async () => {
    const ds = new DataStore();
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));

    ds.upsert({ id: 'a' }); // arms a microtask flush
    ds.setFlushMode('manual'); // …which this cancels
    await tick();
    expect(seen).toHaveLength(0);

    ds.flush();
    expect(seen).toHaveLength(1);
  });

  it("'frame' defers then flushes asynchronously (rAF, or microtask fallback in node)", async () => {
    const ds = new DataStore();
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));
    ds.setFlushMode('frame');

    ds.upsert({ id: 'a' });
    ds.upsert({ id: 'b' });
    expect(seen).toHaveLength(0);

    await macro(50);
    expect(seen).toHaveLength(1);
    expect(seen[0]!.added.sort()).toEqual(['a', 'b']);
  });

  it('LayerData honours manual mode the same way', async () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    const versions: number[] = [];
    ld.on('flush', (e) => versions.push(e.version));

    ld.addNode({ id: 'n0' });
    ld.addNode({ id: 'n1' });
    await tick();
    expect(versions).toHaveLength(0);

    ld.flush();
    expect(versions).toEqual([1]);
  });

  it('coalesces a bulk batch into ONE manual flush regardless of write count', () => {
    const ld = new LayerData();
    ld.setFlushMode('manual');
    let flushes = 0;
    let added = 0;
    ld.on('flush', (e) => {
      flushes++;
      added += e.nodes.added.length;
    });

    for (let i = 0; i < 50; i++) ld.addNode({ id: `n${i}` });
    ld.flush();

    expect(flushes).toBe(1);
    expect(added).toBe(50);
  });
});
