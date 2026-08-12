import { describe, expect, it } from 'vitest';

import { DirtyBatcher } from '../../src/index';

/** The relocated per-frame dirty batcher (decision D1) — dedupe, double-buffer, rebuildAll. */
describe('DirtyBatcher — coalesced per-frame dirty set', () => {
  type Bucket = 'shape' | 'edge';

  it('dedupes marks and drains them in one flush', () => {
    const b = new DirtyBatcher<Bucket>();
    expect(b.hasPending()).toBe(false);
    b.mark('shape', 'n1');
    b.mark('shape', 'n1'); // dupe
    b.mark('shape', 'n2');
    b.mark('edge', 'e1');
    expect(b.hasPending()).toBe(true);

    const snap = b.flush();
    expect([...(snap.buckets.get('shape') ?? [])].sort()).toEqual(['n1', 'n2']);
    expect([...(snap.buckets.get('edge') ?? [])]).toEqual(['e1']);
    expect(b.hasPending()).toBe(false);
  });

  it('marks during flush land in the NEXT frame (double buffer)', () => {
    const b = new DirtyBatcher<Bucket>();
    b.mark('shape', 'n1');
    b.flush();
    b.mark('shape', 'n2');
    const snap = b.flush();
    expect([...(snap.buckets.get('shape') ?? [])]).toEqual(['n2']);
  });

  it('markAll flags a whole bucket for rebuild', () => {
    const b = new DirtyBatcher<Bucket>();
    b.markAll('shape');
    expect(b.isRebuildAll('shape')).toBe(true);
    const snap = b.flush();
    expect(snap.rebuildAll.has('shape')).toBe(true);
  });

  it('reset clears everything', () => {
    const b = new DirtyBatcher<Bucket>();
    b.mark('shape', 'n1');
    b.reset();
    expect(b.hasPending()).toBe(false);
    expect(b.bucketSize('shape')).toBe(0);
  });
});
