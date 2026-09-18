/**
 * `CanvasConfig` — the canvas's visual configuration as **pure JSON**, keyed by
 * instance id. No class references, so it serialises cleanly: persist it, diff
 * it, or generate a settings UI from it.
 *
 * Classes are registered imperatively (`canvas.layers.add(new XLayer({ id }))`);
 * the config addresses those instances by the *same id* and is applied through
 * `Canvas.update()` — which fans each slice to the instance's `setOptions`.
 *
 * See `unified-canvas-options-plan.md`.
 */

import type { EasingName } from '@invana/canvas-core';

/** Per-instance options keyed by id. Each value is the instance's own option bag. */
export interface CanvasConfig {
  /** Layer options keyed by the layer's id. */
  layers?: Record<string, Record<string, unknown>>;
  /** Behaviour options keyed by the behaviour's id. */
  behaviours?: Record<string, Record<string, unknown>>;
  /** Layout options keyed by the layout's id. */
  layouts?: Record<string, Record<string, unknown>>;
  /**
   * Id of the active layout among {@link layouts}. A graph runs one at a time.
   * `Canvas.runLayout(id)` applies it; a domain facade (e.g. `GraphCanvas`)
   * auto-runs it when the target layer's data changes.
   */
  activeLayout?: string;
  /**
   * Fit the camera to content **once on load**, so the drawing is centred when it
   * first appears — independent of any layout. The engine fits the union of its
   * world layers' bounds once, after the viewport has its real size and (when an
   * {@link activeLayout} is set) that layout has settled. Default `false`
   * (opt-in). Init-only: read when the canvas initialises.
   */
  fitOnLoad?: boolean;
  /**
   * Ease the **first** auto-fit instead of snapping to it, so the view glides
   * into frame. Absent (the default) keeps today's instant fit.
   *
   * Only the first fit of a canvas's life is eased. The auto-fitter re-fits as
   * a layout runs, and easing each of those would turn a settling graph into a
   * chase; and once the user has touched the camera, any camera write of ours
   * is already on thin ice (see the rejected `fitOnResize`, `D7`). A user pan or
   * zoom mid-glide cancels it outright.
   *
   * Requires {@link fitOnLoad} — there is no first auto-fit without it.
   * Init-only, and pure JSON: the easing is a **name**, never a function.
   */
  fitAnimation?: {
    /** Glide length in ms. Default `400`. */
    durationMs?: number;
    /** Named easing curve. Default `'easeOutCubic'`. */
    easing?: EasingName;
  };
  /**
   * Fade the canvas's **world** content in once, the first time it is worth
   * showing, instead of cutting from blank to complete. Absent (the default) is
   * today's behaviour and costs nothing.
   *
   * This is one alpha tween on the world surfaces — not a per-item effect — so
   * it works for any content (graph, ER diagram, map) and its cost does not
   * grow with the number of items. Screen-fixed layers are excluded: overlay
   * chrome blinking in reads as a glitch, not as an arrival. For a *staggered*
   * per-item sweep, reach for `@invana/graph`'s `EntranceBehaviour` instead;
   * the two are independent and composable.
   *
   * ### When it plays
   *
   * Once per canvas, on the first frame worth showing — with {@link fitOnLoad},
   * the first fit (the moment the camera has framed real positions); otherwise
   * the first data flush. The world surfaces are held at alpha 0 from the moment
   * this config lands until then, so nothing paints at full opacity first. A
   * bounded grace period releases the fade regardless, so a canvas whose trigger
   * never arrives can never stay invisible.
   *
   * Init-only, and pure JSON.
   */
  entrance?: {
    /** The only entrance kind today: a straight opacity fade. */
    kind: 'fade';
    /** Fade length in ms. Default `320`. */
    durationMs?: number;
    /** Named easing curve. Default `'easeOutCubic'`. */
    easing?: EasingName;
  };
}

/** Narrow an instance to one exposing `setOptions`. */
export function configurable(inst: unknown): { setOptions(patch: unknown): void } | undefined {
  return inst && typeof (inst as { setOptions?: unknown }).setOptions === 'function'
    ? (inst as { setOptions(patch: unknown): void })
    : undefined;
}

/** A plain (POJO) object — the only kind merge recurses into. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively merge `patch` into `base`. Plain objects merge field-by-field;
 * everything else (arrays, functions, class instances, primitives) replaces —
 * matching the shallow semantics of `GraphLayer.setNodeDefaults`.
 */
export function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    // Skip prototype-polluting keys — this merge runs on untrusted imported
    // config (see importState). Copy-based, so pollution stays local, but the
    // guard keeps a corrupted merge result from ever forming.
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}
