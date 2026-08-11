/**
 * P5 — gesture arbitration.
 *
 * These tests exist because the failure mode is asymmetric: a *refused* claim
 * costs one gesture, but a **leaked** claim freezes the camera permanently —
 * strictly worse than the `pause('drag')` mechanism it replaces. So the leak
 * paths get the coverage, not the happy path.
 *
 * See `docs/renderer-split-design.md` §9 (P5).
 */
import { describe, expect, it, vi } from 'vitest';
import { DefaultGestureArbiter } from '../../src/input/GestureArbiter';

describe('GestureArbiter', () => {
  it('grants an uncontested claim and names the owner', () => {
    const a = new DefaultGestureArbiter();
    expect(a.owner).toBeNull();

    const release = a.claim('drag-node');
    expect(release).toBeTypeOf('function');
    expect(a.owner).toBe('drag-node');

    release!();
    expect(a.owner).toBeNull();
  });

  it('refuses a second claimant while one is active', () => {
    const a = new DefaultGestureArbiter();
    a.claim('drag-node');
    expect(a.claim('lasso-select')).toBeNull();
    expect(a.owner).toBe('drag-node');
  });

  it('is safe to release twice', () => {
    const a = new DefaultGestureArbiter();
    const release = a.claim('brush-select')!;
    release();
    release();
    expect(a.owner).toBeNull();
  });

  it('a stale release cannot evict a later owner — the leak that would freeze the camera', () => {
    const a = new DefaultGestureArbiter();
    const staleRelease = a.claim('drag-node')!;
    staleRelease();

    a.claim('lasso-select');
    staleRelease(); // late call from the finished gesture

    expect(a.owner).toBe('lasso-select');
  });

  it('lets the current owner re-claim, so a behaviour cannot lock itself out', () => {
    const a = new DefaultGestureArbiter();
    a.claim('drag-node'); // leaked: never released
    const second = a.claim('drag-node');

    expect(second).toBeTypeOf('function');
    expect(a.owner).toBe('drag-node');

    second!();
    expect(a.owner).toBeNull();
  });

  it('invalidates the earlier token when the owner re-claims', () => {
    const a = new DefaultGestureArbiter();
    const first = a.claim('drag-node')!;
    const second = a.claim('drag-node')!;

    first(); // the superseded token must not clear the live claim
    expect(a.owner).toBe('drag-node');

    second();
    expect(a.owner).toBeNull();
  });

  it('frees the pointer for the next claimant once released', () => {
    const a = new DefaultGestureArbiter();
    const release = a.claim('drag-node')!;
    expect(a.claim('lasso-select')).toBeNull();

    release();
    expect(a.claim('lasso-select')).toBeTypeOf('function');
    expect(a.owner).toBe('lasso-select');
  });

  it('pre-empts a lower-priority owner and tells it it was revoked', () => {
    const a = new DefaultGestureArbiter();
    const onRevoke = vi.fn();
    const low = a.claim('drag-node', { onRevoke })!;

    const high = a.claim('node-resize', { priority: 10 });
    expect(high).toBeTypeOf('function');
    expect(a.owner).toBe('node-resize');
    expect(onRevoke).toHaveBeenCalledOnce();

    // The revoked owner's release is inert — it must not free the pre-emptor.
    low();
    expect(a.owner).toBe('node-resize');
  });

  it('does not pre-empt at equal priority — first claim wins', () => {
    const a = new DefaultGestureArbiter();
    a.claim('drag-node');
    expect(a.claim('draw-edge')).toBeNull();
    expect(a.owner).toBe('drag-node');
  });
});
