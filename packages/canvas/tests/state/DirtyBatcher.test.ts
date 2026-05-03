import { describe, expect, it } from 'vitest';
import { DirtyBatcher } from '../../src/state/DirtyBatcher';

type Bucket = 'shape' | 'halo' | 'edge';

describe('DirtyBatcher — basic', () => {
  it('starts empty', () => {
    const db = new DirtyBatcher<Bucket>();
    expect(db.hasPending()).toBe(false);
    expect(db.bucketSize('shape')).toBe(0);
    expect(db.isRebuildAll('shape')).toBe(false);
  });

  it('mark() sets pending and accumulates ids', () => {
    const db = new DirtyBatcher<Bucket>();
    db.mark('shape', 'n-1');
    db.mark('shape', 'n-2');
    db.mark('shape', 'n-1'); // dedup
    db.mark('halo', 'n-3');

    expect(db.hasPending()).toBe(true);
    expect(db.bucketSize('shape')).toBe(2);
    expect(db.bucketSize('halo')).toBe(1);
    expect(db.bucketSize('edge')).toBe(0);
  });

  it('markAll() flags a bucket without per-id Set overhead', () => {
    const db = new DirtyBatcher<Bucket>();
    db.markAll('shape');
    expect(db.hasPending()).toBe(true);
    expect(db.isRebuildAll('shape')).toBe(true);
    expect(db.isRebuildAll('halo')).toBe(false);
  });

  it('flush() returns the accumulated snapshot and clears state', () => {
    const db = new DirtyBatcher<Bucket>();
    db.mark('shape', 'n-1');
    db.mark('halo', 'n-2');
    db.markAll('edge');

    const snap = db.flush();
    expect([...snap.buckets.get('shape')!]).toEqual(['n-1']);
    expect([...snap.buckets.get('halo')!]).toEqual(['n-2']);
    expect(snap.rebuildAll.has('edge')).toBe(true);

    expect(db.hasPending()).toBe(false);
    expect(db.bucketSize('shape')).toBe(0);
    expect(db.bucketSize('halo')).toBe(0);
    expect(db.isRebuildAll('edge')).toBe(false);
  });

  it('snapshot remains stable while consumer iterates (mid-flush mark lands next frame)', () => {
    const db = new DirtyBatcher<Bucket>();
    db.mark('shape', 'n-1');

    const snap = db.flush();
    // Simulate a consumer iterating the snapshot AND making a new mark
    // (which should land in the next frame's bucket).
    const seen: string[] = [];
    for (const id of snap.buckets.get('shape')!) {
      seen.push(id);
      db.mark('shape', `mid-${id}`); // re-arms for next frame
    }
    expect(seen).toEqual(['n-1']);

    // The new mark from inside the loop is in the next frame's batch.
    expect(db.hasPending()).toBe(true);
    expect(db.bucketSize('shape')).toBe(1);

    const snap2 = db.flush();
    expect([...snap2.buckets.get('shape')!]).toEqual(['mid-n-1']);
  });

  it('reused Sets are cleared between flushes (no leak)', () => {
    const db = new DirtyBatcher<Bucket>();
    for (let i = 0; i < 5; i++) {
      db.mark('shape', `n-${i}`);
    }
    db.flush();

    db.mark('shape', 'fresh');
    const snap = db.flush();
    expect([...snap.buckets.get('shape')!]).toEqual(['fresh']);
  });

  it('reset() drops both buffers and clears pending flag', () => {
    const db = new DirtyBatcher<Bucket>();
    db.mark('shape', 'a');
    db.mark('halo', 'b');
    db.markAll('edge');
    db.reset();
    expect(db.hasPending()).toBe(false);
    expect(db.bucketSize('shape')).toBe(0);
    expect(db.bucketSize('halo')).toBe(0);
    expect(db.isRebuildAll('edge')).toBe(false);
  });

  it('flush() on an empty batcher returns empty snapshot without crashing', () => {
    const db = new DirtyBatcher<Bucket>();
    const snap = db.flush();
    expect(snap.rebuildAll.size).toBe(0);
    // buckets is a ReadonlyMap; iteration over an empty batch yields no items.
    expect(snap.buckets.size).toBe(0);
  });
});

describe('DirtyBatcher — perf smoke', () => {
  it('1M marks across 3 buckets stay well within a frame budget', () => {
    const db = new DirtyBatcher<Bucket>();
    const t0 = performance.now();
    const buckets = ['shape', 'halo', 'edge'] as const;
    for (let i = 0; i < 1_000_000; i++) {
      const bucket = buckets[i % 3]!;
      db.mark(bucket, `n-${i % 100_000}`); // dedup 10× into 100k unique
    }
    const ms = performance.now() - t0;
    // Generous bound for CI variance — typical local run ~400-550 ms.
    // The architectural assertion is "linear-time, no allocation surprises";
    // any blow-up would be 10×+, well past this.
    expect(ms).toBeLessThan(1500);

    const snap = db.flush();
    // 100k uniques per modulo; spread across 3 buckets they share prefixes
    // so per-bucket count is ~100k / 3 with dedup. Just assert non-empty.
    expect(db.hasPending()).toBe(false);
    expect(snap.buckets.get('shape')!.size).toBeGreaterThan(0);
  });
});
