/**
 * `ModifierTracker` — global helper that tracks which keyboard modifier keys
 * are currently held. Several behaviours (Click/Brush/Lasso) need to know
 * the modifier state at the moment of a pointer event, but the renderer's
 * shape/connector pointer events don't carry that info — they're synthesised
 * from PixiJS events. Tracking modifiers via window-level key events is the
 * pragmatic substitute.
 *
 * Reference-counted: the first behaviour to call `attach()` installs the
 * window listeners; subsequent `attach()` calls just bump the counter.
 * `detach()` removes the listeners when the count returns to zero.
 *
 * @internal — not exported from `@invana/graph`. Used by behaviours.
 */

export type ModifierKey = 'shift' | 'control' | 'alt' | 'meta';

const held: Set<ModifierKey> = new Set();
let refCount = 0;

function onKeyDown(e: KeyboardEvent): void {
  if (e.shiftKey) held.add('shift');
  if (e.ctrlKey) held.add('control');
  if (e.altKey) held.add('alt');
  if (e.metaKey) held.add('meta');
}

function onKeyUp(e: KeyboardEvent): void {
  if (!e.shiftKey) held.delete('shift');
  if (!e.ctrlKey) held.delete('control');
  if (!e.altKey) held.delete('alt');
  if (!e.metaKey) held.delete('meta');
}

function onBlur(): void {
  held.clear();
}

export const ModifierTracker = {
  /** Install window listeners (refcounted). Safe to call repeatedly. */
  attach(): void {
    if (refCount === 0 && typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
    }
    refCount++;
  },

  /** Remove window listeners when the last user detaches. */
  detach(): void {
    if (refCount === 0) return;
    refCount--;
    if (refCount === 0 && typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      held.clear();
    }
  },

  /** True iff *any* of the given modifier keys is currently held. */
  anyHeld(keys: readonly ModifierKey[]): boolean {
    for (const k of keys) if (held.has(k)) return true;
    return false;
  },

  /** Snapshot of currently held modifiers. */
  snapshot(): ReadonlySet<ModifierKey> {
    return new Set(held);
  },
};
