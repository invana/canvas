/**
 * `ScreenScaleTarget` subclasses for `GraphLayer` — plug `@invana/canvas`'s
 * `ScreenSizeBehaviour` into graph-specific entity attributes.
 *
 *   - `GraphNodesScreenScaleTarget` — node `size` (body) + optional `strokeWidth` (outline)
 *   - `GraphEdgesScreenScaleTarget` — edge `strokeWidth` (connector body)
 *
 * Per the canvas `ScreenScaleTarget` contract, each subclass owns its own
 * register / destroy lifecycle, resolves its `layerId` against the
 * `CanvasContext` at register time, and reads its current camera-scale
 * via the behaviour's RAF-coalesced `reflow(scale)` call.
 *
 * ## Why we bypass `store.updateNode` here
 *
 * The obvious implementation — call `layer.store.updateNode(id, { data })`
 * with rescaled sizes — fires `node:update`, which `GraphLayer.updateNodeShape`
 * translates into `renderer.removeShape(id) + renderer.addShape(id)`. That's
 * a full pixi Graphics destroy + create per node, every zoom event. For the
 * Routes story (2,980 nodes + ~6,000 edges) that's ~9k destroy/create ops
 * per zoom; combined with MapLibre's 100Hz wheel-zoom emission it tanks fps.
 *
 * Instead we reach for the renderer directly: `renderer.updateShape(id, partial)`
 * is a shallow-merge that just calls `shape.draw(spec)` on the same Graphics
 * — an order of magnitude cheaper. The data store stays at the original
 * world-unit values, so the source of truth never diverges with the
 * behaviour disabled. On `restore()` we replay the originals back through
 * the renderer.
 *
 * **Trade-off:** since we don't mutate `data`, other consumers reading
 * `node.data.size` see the *original* value, not the rescaled one. For the
 * density-contour overlay this is fine (it reads positions, not sizes).
 * For any future consumer that genuinely needs the on-screen size, they
 * should derive it from `camera.scale` themselves or read the renderer
 * spec — the data store is the source of truth for *world-unit* values.
 *
 * ## Extending for new entity kinds
 *
 * Subclass `ScreenScaleTarget` directly. Resolve your target layer in
 * `onRegister`, iterate its entities + call `renderer.updateShape` (or
 * the equivalent partial-update for non-shape primitives) in `reflow`.
 * Future targets in this vein: group-header heights, annotation pin
 * sizes, lane-label fonts, etc.
 */

import { ScreenScaleTarget, type CanvasContext } from '@invana/canvas';

import type { GraphLayer } from './layer/GraphLayer';

type LooseRenderer = {
  updateShape(id: string, partial: Record<string, unknown>): void;
  setConnectorStroke(id: string, stroke: { color: number; width: number }): void;
};

type NumberOrGetter = number | (() => number);

function resolveValue(v: NumberOrGetter | undefined): number | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'function' ? v() : v;
}

function readNumberField(data: unknown, field: string): number | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>)[field];
  return typeof v === 'number' ? v : undefined;
}

function readShapeKind(data: unknown): 'circle' | 'rect' | 'arc' | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>).shape;
  if (v === 'circle' || v === 'rect' || v === 'arc') return v;
  return undefined;
}

/* ─── Nodes ────────────────────────────────────────────────────────────────── */

export interface GraphNodesScreenScaleTargetOptions {
  /** Required — the `GraphLayer` whose nodes are rescaled. */
  layerId: string;

  /**
   * Target body size (diameter for circle, width for rect) in screen px
   * for nodes that don't carry a per-node `data.size` override. Defaults
   * to the layer's `nodeDefaults.size` when omitted. Accepts a static
   * number or a getter (`() => settings.targetNodePx`) — getters are
   * re-read on every reflow, so GUI sliders update live.
   */
  sizePx?: NumberOrGetter;

  /**
   * Target outline width in screen px. When set, the target also writes
   * a partial `stroke` update on every reflow so the outline stays
   * pixel-constant. Omit to leave stroke width in world units (it'll
   * thin to a hairline at world zoom / fatten to a slab at city zoom).
   */
  strokeWidthPx?: NumberOrGetter;
}

/**
 * Rescale every node's body (and optionally its outline width) so the
 * rendered shape stays the same screen-pixel size across camera zoom.
 *
 * Supports `circle` and `rect` node shapes. `arc`-shape nodes are
 * skipped — their geometry is in `innerR` / `outerR` / sweep angles and
 * doesn't map cleanly to a single screen-px input.
 */
export class GraphNodesScreenScaleTarget extends ScreenScaleTarget {
  private readonly opts: GraphNodesScreenScaleTargetOptions;
  private layer: GraphLayer | null = null;

  constructor(opts: GraphNodesScreenScaleTargetOptions) {
    super();
    this.opts = opts;
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.opts.layerId);
    if (!layer) {
      throw new Error(
        `GraphNodesScreenScaleTarget: layer "${this.opts.layerId}" not found in CanvasContext.`,
      );
    }
    this.layer = layer;
  }

  protected override onDestroy(): void {
    this.layer = null;
  }

  override reflow(scale: number): void {
    this.writeAtScale(Math.max(scale, 1e-6));
  }

  override restore(): void {
    // Restore = reflow at scale 1 — world-unit sizing is exactly what
    // `data.size` (or the layer default) means before any rescaling.
    this.writeAtScale(1);
  }

  private writeAtScale(scale: number): void {
    const layer = this.layer;
    if (!layer) return;
    const renderer = layer.getRenderer() as LooseRenderer | undefined;
    if (!renderer) return;

    const defaults = layer.getNodeDefaults();
    const fallbackSizePx = resolveValue(this.opts.sizePx) ?? defaults.size;
    const fallbackSwPx = resolveValue(this.opts.strokeWidthPx);

    for (const node of layer.store.nodes()) {
      const data = node.data;
      const kind = readShapeKind(data) ?? defaults.shape;
      if (kind === 'arc') continue;

      // Per-node `data.size` always wins over the behaviour's fallback —
      // matches the resolution order used everywhere else in GraphLayer.
      const baseSize = readNumberField(data, 'size') ?? fallbackSizePx;
      const worldSize = baseSize / scale;

      const partial: Record<string, unknown> = {};
      if (kind === 'circle') {
        partial.radius = worldSize / 2;
      } else {
        // rect
        partial.width = worldSize;
        const baseHeight = readNumberField(data, 'height') ?? baseSize;
        partial.height = baseHeight / scale;
      }

      if (fallbackSwPx !== undefined) {
        const baseSw = readNumberField(data, 'strokeWidth') ?? fallbackSwPx;
        const strokeColor =
          readNumberField(data, 'stroke') ??
          (typeof defaults.stroke === 'number' ? defaults.stroke : undefined);
        // Skip stroke entirely when explicitly disabled via `stroke: false`
        // — partial-merging `{ stroke: { color: undefined, width } }` would
        // produce a junk stroke spec at draw time.
        if (strokeColor !== undefined && data && (data as Record<string, unknown>).stroke !== false) {
          partial.stroke = { color: strokeColor, width: baseSw / scale };
        }
      }

      renderer.updateShape(node.id, partial);
    }
  }
}

/* ─── Edges ────────────────────────────────────────────────────────────────── */

export interface GraphEdgesScreenScaleTargetOptions {
  /** Required — the `GraphLayer` whose edges are rescaled. */
  layerId: string;

  /**
   * Target stroke width in screen px for edges that don't carry a
   * per-edge `data.strokeWidth` override. Defaults to the layer's
   * `edgeDefaults.strokeWidth`. Accepts a static number or a getter.
   */
  strokeWidthPx?: NumberOrGetter;
}

/**
 * Rescale every edge's connector stroke width so it stays the same
 * screen-pixel width across camera zoom.
 *
 * Uses `PrimitivesRenderer.setConnectorStroke` (not `updateConnector`)
 * to skip the per-edge path recompute. `updateConnector` re-runs the
 * router and rebuilds an obstacle list by iterating every shape in the
 * renderer — for thousands of edges that's `O(edges × shapes)` per
 * reflow and crushes fps during continuous zoom. The path doesn't
 * depend on scale, so re-routing on a stroke-only change is wasted
 * work; `setConnectorStroke` just redraws the body on the cached path.
 */
export class GraphEdgesScreenScaleTarget extends ScreenScaleTarget {
  private readonly opts: GraphEdgesScreenScaleTargetOptions;
  private layer: GraphLayer | null = null;

  constructor(opts: GraphEdgesScreenScaleTargetOptions) {
    super();
    this.opts = opts;
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.opts.layerId);
    if (!layer) {
      throw new Error(
        `GraphEdgesScreenScaleTarget: layer "${this.opts.layerId}" not found in CanvasContext.`,
      );
    }
    this.layer = layer;
  }

  protected override onDestroy(): void {
    this.layer = null;
  }

  override reflow(scale: number): void {
    this.writeAtScale(Math.max(scale, 1e-6));
  }

  override restore(): void {
    this.writeAtScale(1);
  }

  private writeAtScale(scale: number): void {
    const layer = this.layer;
    if (!layer) return;
    const renderer = layer.getRenderer() as LooseRenderer | undefined;
    if (!renderer) return;

    const defaults = layer.getEdgeDefaults();
    const fallbackSwPx = resolveValue(this.opts.strokeWidthPx) ?? defaults.strokeWidth;

    for (const edge of layer.store.edges()) {
      const data = edge.data;
      const baseSw = readNumberField(data, 'strokeWidth') ?? fallbackSwPx;
      const strokeColor = readNumberField(data, 'stroke') ?? defaults.stroke;
      renderer.setConnectorStroke(edge.id, {
        color: strokeColor,
        width: baseSw / scale,
      });
    }
  }
}
