import { enableMapSet, enablePatches, produceWithPatches, type Patch } from 'immer';

import type { DeepPartial, Recipe, Update } from './types';

// Opt immer into Map/Set drafting (selection sets, state maps) and patch
// recording (forward + inverse) — both load-bearing for this store. Idempotent.
enableMapSet();
enablePatches();

/** A plain (POJO) object — the only kind {@link applyDeepPartial} recurses into. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Keys that must never be written from an untrusted patch. Merging in place
 * means a recursive step into `__proto__` / `constructor` / `prototype` escapes
 * the immer draft onto the real prototype chain, so an object-form patch parsed
 * from untrusted JSON (`{"k":{"__proto__":{…}}}`) would pollute
 * `Object.prototype` globally. Skipping these keys closes that.
 */
const FORBIDDEN_MERGE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Deep-merge `patch` into a mutable `draft` in place: plain objects merge
 * field-by-field; everything else (arrays, sets, maps, functions, primitives,
 * class instances) **replaces**. Mirrors the engine's `deepMerge` semantics.
 *
 * Prototype-polluting keys ({@link FORBIDDEN_MERGE_KEYS}) are skipped — this is
 * the store's public write path (`update(patch)`) and receives untrusted input.
 */
export function applyDeepPartial(draft: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(patch)) {
    if (FORBIDDEN_MERGE_KEYS.has(k)) continue;
    const cur = draft[k];
    if (isPlainObject(v) && isPlainObject(cur)) applyDeepPartial(cur, v);
    else draft[k] = v;
  }
}

/**
 * Apply an {@link Update} (recipe or deep-partial patch) to `state` via immer,
 * returning the next state plus the forward/inverse patch pair. Pure — does not
 * mutate `state`.
 */
export function computeChange<T>(
  state: T,
  update: Update<T>,
): { next: T; patches: Patch[]; inverse: Patch[] } {
  const recipe: Recipe<T> =
    typeof update === 'function'
      ? (update as Recipe<T>)
      : (draft) => {
          applyDeepPartial(draft as Record<string, unknown>, update as Record<string, unknown>);
        };
  const [next, patches, inverse] = produceWithPatches(state as object, (draft) => {
    recipe(draft as T);
  });
  return { next: next as T, patches, inverse };
}

/** Top-level keys touched by a patch set — bounded cardinality, span/metric-safe. */
export function changedPaths(patches: readonly Patch[]): string[] {
  const seen = new Set<string>();
  for (const p of patches) {
    const head = p.path[0];
    if (head !== undefined) seen.add(String(head));
  }
  return [...seen];
}

export type { DeepPartial };
