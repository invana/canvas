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
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}
