/**
 * `NodeScaleLODBehaviour` — keep `GraphLayer` node bodies (and their
 * outline strokes) at a fixed screen-pixel size across camera zoom.
 *
 * Concrete subclass of `ElementScaleLODBehaviour` — that base owns the
 * RAF coalescing, `camera:zoom` subscription, and enable/disable
 * lifecycle. This class only knows how to rescale graph nodes.
 *
 * ## How it works (transform-scale fast path)
 *
 * On enable (and on `reflow()` after a GUI knob moves), the behaviour
 * does **one** expensive O(N) pass: it rewrites every node's spec so
 * the geometric values (`radius`, `width`, `height`, `stroke.width`)
 * carry the target-pixel sizes as if they were world units. Then per
 * `camera:zoom` it does the cheap pass: a single
 * `renderer.scaleShape(id, 1 / cameraScale)` per node, which just writes
 * the gfx transform — no `Graphics.clear()`, no path retrace, no spec
 * mutation. That collapses thousands of geometry rebuilds per zoom
 * frame into thousands of transform writes (~50× cheaper).
 *
 * Stroke width travels along the transform (Pixi strokes are in local
 * units), so the stroke is pixel-constant by construction. There is no
 * way to opt the stroke out of the transform while keeping the body in
 * — the two are coupled by the single scale factor.
 *
 * Pair with {@link EdgeScaleLODBehaviour} when you also want pixel-constant
 * edge strokes. They're independent behaviours; their RAF callbacks
 * batch into the same animation frame, so registering both has the same
 * per-frame cost as one monolith doing both passes.
 *
 * Supports `circle` and `rect` node shapes. `arc`-shape nodes are
 * skipped — their geometry is in `innerR` / `outerR` / sweep angles and
 * doesn't map cleanly to a single screen-px input.
 *
 * Hosts with `setDecoration` decorations or attached badges are also
 * supported, but those auxiliary visuals are **not** re-anchored on
 * each zoom — the underlying `scaleShape` fast path skips the
 * decoration / badge refresh that `updateShape` performs. Acceptable
 * for halos/glows (still centred on the host); inappropriate for
 * placement-sensitive badges. Use `updateShape` directly in that case.
 *
 * @example
 * ```ts
 * import { NodeScaleLODBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new NodeScaleLODBehaviour({
 *     id: 'node-scale-lod',
 *     enabled: true,
 *     layers: [
 *       {
 *         targetLayerId: 'graph',
 *         sizePx: 6,          // node diameter in screen px
 *         strokeWidthPx: 1,   // outline width in screen px (omit to leave in world units)
 *       },
 *     ],
 *   }),
 * );
 * ```
 */

import {
  ElementScaleLODBehaviour,
  resolveNumberOrGetter,
  type CanvasContext,
  type ElementScaleLODBehaviourOptions,
  type NumberOrGetter,
  type PrimitivesRenderer,
} from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';

/** Per-`GraphLayer` config — one entry per layer this behaviour rescales. */
export interface NodeScaleLODConfig {
  /** Required — the `GraphLayer` whose nodes are rescaled. */
  targetLayerId: string;
  /**
   * Target body size in screen px for nodes that don't carry a per-node
   * `data.size` override. Falls back to the layer's `nodeDefaults.size`
   * when omitted. Accepts a static number or a getter — getters re-read
   * on every reflow so GUI sliders update live.
   */
  sizePx?: NumberOrGetter;
  /**
   * Target outline width in screen px. When omitted, the layer's
   * `nodeDefaults.strokeWidth` (or each node's `data.strokeWidth`) is
   * reinterpreted as the implicit pixel target — the transform-scale
   * fast path always pins both body and stroke together, so the stroke
   * is pixel-constant even without an explicit value here. Setting an
   * explicit value just changes what that pixel target is.
   */
  strokeWidthPx?: NumberOrGetter;
}

export interface NodeScaleLODBehaviourOptions extends ElementScaleLODBehaviourOptions {
  /** One config per `GraphLayer` to drive. */
  layers: NodeScaleLODConfig[];
}

interface ResolvedTarget {
  config: NodeScaleLODConfig;
  layer: GraphLayer;
}

/**
 * Trailing-edge debounce for the reanchor pass — see
 * {@link NodeScaleLODBehaviour.apply}. Picked to match
 * {@link EdgeScaleLODBehaviour}'s `DEFAULT_EDGE_SETTLE_MS = 80`: short
 * enough to feel "instant on release", long enough that a fling never
 * fires it mid-gesture.
 */
const REANCHOR_SETTLE_MS = 80;

export class NodeScaleLODBehaviour extends ElementScaleLODBehaviour<NodeScaleLODBehaviourOptions> {
  /** Live-read from `_options` so `setOptions` applies; `onOptionsChanged` reflows. */
  private get configs(): NodeScaleLODConfig[] { return this._options.layers; }
  private resolved: ResolvedTarget[] = [];
  /**
   * Pending reanchor timer. The per-frame `scaleShape` fast path is cheap
   * (transform writes only), but `reanchorAllConnectors` rebuilds every
   * connector's Pixi geometry — at thousands of edges that drops fps to
   * the floor under a continuous zoom gesture. Coalesce to a single
   * trailing-edge call.
   */
  private reanchorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: NodeScaleLODBehaviourOptions) {
    super(opts);
  }

  /**
   * Re-write the baseline and re-apply the transform when a live option patch
   * lands (e.g. a `sizePx` / `strokeWidthPx` slider), so the change shows
   * without waiting for the next zoom. `reflow()` is overridden here to
   * `writeBaseline('target')` first.
   */
  protected override onOptionsChanged(): void {
    this.reflow();
  }

  protected override onResolveTargets(ctx: CanvasContext): void {
    for (const config of this.configs) {
      const layer = ctx.layers.get<GraphLayer>(config.targetLayerId);
      if (!layer) {
        throw new Error(
          `NodeScaleLODBehaviour "${this.id}": layer "${config.targetLayerId}" not found in CanvasContext.`,
        );
      }
      this.resolved.push({ config, layer });
    }
  }

  protected override onReleaseTargets(): void {
    if (this.reanchorTimer !== null) {
      clearTimeout(this.reanchorTimer);
      this.reanchorTimer = null;
    }
    this.resolved = [];
  }

  /**
   * Per-frame fast path. Sets `gfx.scale = 1 / cameraScale` on every node
   * via the renderer's transform fast path — no geometry rebuild. The
   * spec was pre-set to "target-px values treated as world units" by
   * {@link writeBaseline} at enable / reflow time, so:
   *
   *     on-screen = nativeWorldSize × cameraScale × gfxScale
   *               = (sizePx / 1)    × cameraScale × (1 / cameraScale)
   *               = sizePx ✓
   *
   * Stroke width scales with the body (Pixi's stroke is in local units)
   * — which is precisely the pixel-constant intent.
   */
  protected override apply(rawScale: number): void {
    const scale = Math.max(rawScale, 1e-6);
    const gfxScale = 1 / scale;
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      for (const node of layer.store.nodes()) {
        renderer.scaleShape(node.id, gfxScale);
      }
    }
    // The transform-scale fast path mutates each shape's *visible*
    // silhouette without touching its spec. Connectors anchored to those
    // shapes cached a path against the pre-scale bounds, so they fall
    // short of (or overshoot) the now-resized shape until re-anchored.
    //
    // Reanchoring runs `recomputeConnectorPath` per edge, which redraws
    // the Pixi geometry — at multiple-thousand edges that flattens fps
    // during a continuous zoom. We debounce the reanchor to a trailing
    // call: mid-gesture frames stay on the cheap `scaleShape`-only path
    // and edges snap to the new silhouette ~80ms after the user stops
    // zooming. The transient mis-anchor is bounded by node radius in
    // screen px (≈ 5px at typical `sizePx`) — visually negligible.
    this.scheduleReanchor();
  }

  private scheduleReanchor(): void {
    if (this.reanchorTimer !== null) clearTimeout(this.reanchorTimer);
    this.reanchorTimer = setTimeout(() => {
      this.reanchorTimer = null;
      this.flushReanchor();
    }, REANCHOR_SETTLE_MS);
  }

  private flushReanchor(): void {
    if (this.reanchorTimer !== null) {
      clearTimeout(this.reanchorTimer);
      this.reanchorTimer = null;
    }
    for (const { layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      // Hit-test bboxes for this layer's nodes were intentionally left
      // stale by the mid-gesture `scaleShape` fast path (per-id `hit.update`
      // is O(N²) for thousands of shapes). Rebuild them once now via the
      // bulk path so pointer hit-tests are accurate the moment the user
      // stops zooming.
      const ids: string[] = [];
      for (const node of layer.store.nodes()) ids.push(node.id);
      renderer.reindexScaledShapeHits(ids);
      renderer.reanchorAllConnectors();
    }
  }

  protected override onEnable(): void {
    if (!this.ctx) return;
    // Heavy one-shot pass: rewrite every node's spec to "target-px values
    // treated as world units" so the per-frame `apply` can be pure
    // transform writes. Skipped when no targets resolved (paranoid guard
    // — `onRegister` always populates `this.resolved`).
    this.writeBaseline('target');
    super.onEnable();
  }

  protected override onDisable(): void {
    // `super.onDisable` calls `apply(1)` which sets `gfx.scale = 1` on
    // every node via the fast path. Then restore spec back to world-unit
    // values so the visual matches the LOD-off baseline at any camera
    // scale (otherwise nodes would render at `sizePx` world units on
    // disable, which is "huge" when sizePx > defaults.size).
    super.onDisable();
    this.writeBaseline('worldUnit');
  }

  override reflow(): void {
    // GUI sliders (`sizePx`, `strokeWidthPx`) push their new values through
    // `reflow()`. Re-write the baseline first so the spec carries the new
    // target px, then let the base reflow re-apply the transform.
    if (this.isEnabled) this.writeBaseline('target');
    super.reflow();
  }

  /**
   * One-shot O(N) pass that rewrites every node's spec via
   * `renderer.updateShape`. Two flavours:
   *
   * - `'target'` — write the LOD-on baseline: `radius = sizePx / 2`,
   *   `stroke.width = strokeWidthPx`. The per-frame `gfx.scale = 1 / cs`
   *   then collapses the world-unit values back to pixel-constant.
   * - `'worldUnit'` — restore the LOD-off baseline: `radius = (data.size
   *   ?? defaults.size) / 2`, `stroke.width = data.strokeWidth ??
   *   defaults.strokeWidth`. Matches what `GraphLayer.nodeSpec` would
   *   write for a fresh `addShape`.
   *
   * Expensive (each `updateShape` rebuilds the underlying Pixi geometry)
   * — only call on transitions (enable / disable / slider change), not
   * per frame.
   */
  private writeBaseline(mode: 'target' | 'worldUnit'): void {
    for (const { config, layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      this.writeLayerBaseline(layer, renderer, mode, config);
    }
    // The spec just changed across every node — connectors anchored to
    // these nodes still hold paths against the previous radii. Re-anchor
    // once *synchronously* (writeBaseline is a one-shot enable / disable /
    // reflow event, not a per-frame gesture, so the cost is amortised over
    // the user's interaction). `flushReanchor` also cancels any pending
    // debounced reanchor so we don't double-pay.
    this.flushReanchor();
  }

  private writeLayerBaseline(
    layer: GraphLayer,
    renderer: PrimitivesRenderer,
    mode: 'target' | 'worldUnit',
    config: NodeScaleLODConfig,
  ): void {
    const sizePxFallback = resolveNumberOrGetter(config.sizePx);
    const strokePxFallback = resolveNumberOrGetter(config.strokeWidthPx);

    for (const node of layer.store.nodes()) {
      // Read the *currently effective* NodeStyle — what the renderer would
      // hand the shape if we drew it now. That accounts for the layer
      // template, per-node overrides, and any active state overlays.
      const style = layer.resolveNodeStyle(node);
      const shape = style.shape;
      if (!shape) continue;

      // Natural size: longest AABB dimension of the resolved shape, via
      // the shape registry's `static boundsOf` hook. Works for every
      // registered kind (built-in + custom) — no closed switch here.
      const naturalAABB = renderer.boundsOfSpec(shape);
      if (!naturalAABB) continue;
      const naturalSize = Math.max(naturalAABB.width, naturalAABB.height);
      if (naturalSize <= 0) continue;

      // For 'target' mode: write the LOD-on baseline so the per-frame
      // `gfx.scale = 1 / cameraScale` collapses to pixel-constant.
      // For 'worldUnit' mode: restore the natural world-unit baseline that
      // came from the resolved style (matches what `GraphLayer.nodeSpec`
      // would write for a fresh `addShape`).
      const baselineSize = mode === 'target' ? (sizePxFallback ?? naturalSize) : naturalSize;
      const factor = baselineSize / naturalSize;

      // Geometry partial: uniform scale via the shape's `static scaleSpec`
      // hook. Shapes that don't implement scaleSpec (e.g. a custom shape
      // that hasn't opted into LOD) are skipped — the alternative would
      // be guessing which fields to multiply, which silently misbehaves.
      const geomPartial = renderer.scaleShapeSpec(shape, factor);
      if (!geomPartial) continue;

      const partial: Record<string, unknown> = { ...geomPartial };

      // Stroke channel — kind-agnostic, applies to every shape that uses
      // the standard `bg*` paint surface.
      const strokeColor = style.bgStrokeColor;
      const naturalStrokeWidth = style.bgStrokeWidth;
      if (strokeColor !== undefined && naturalStrokeWidth !== undefined && naturalStrokeWidth > 0) {
        const baseSw = mode === 'target' ? (strokePxFallback ?? naturalStrokeWidth) : naturalStrokeWidth;
        partial.stroke = {
          color: strokeColor,
          width: baseSw,
          ...(style.bgStrokeAlignment ? { alignment: style.bgStrokeAlignment } : {}),
        };
      }

      renderer.updateShape(node.id, partial);
    }
  }
}
