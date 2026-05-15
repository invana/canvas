/**
 * `ScreenSizeBehaviour` — keeps `GraphLayer` entities at a fixed
 * **screen-pixel size** across camera zoom.
 *
 * The default for `WorldLayer` content is to grow / shrink with the
 * camera (`size: 6` at zoom 1.6 is 9 screen px; at zoom 8 it's 1500 px).
 * That's right for diagrams and force layouts where the relative
 * geometry between entities matters. For map overlays and many
 * dashboard-style views you want the opposite: a node stays a small
 * round marker whether the user is looking at the whole world or a
 * single city block. Opt in to that via this behaviour, off by default.
 *
 * ## Usage
 *
 * ```ts
 * import { ScreenSizeBehaviour } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new ScreenSizeBehaviour({
 *     id: 'screen-size',
 *     enabled: true,
 *     layers: [
 *       {
 *         layerId: 'graph',
 *         nodes: { sizePx: 6, strokeWidthPx: 1 },
 *         edges: { strokeWidthPx: 0.6 },
 *       },
 *     ],
 *   }),
 * );
 * ```
 *
 * Each `*Px` value can be a static number or a getter (`() => settings.targetPx`).
 * Getters are re-evaluated on every reflow, so GUI sliders update live
 * without re-creating the behaviour.
 *
 * ## How it works
 *
 * On every `camera:zoom` event the behaviour schedules **one**
 * `requestAnimationFrame`; the callback walks each configured layer's
 * nodes / edges and writes rescaled values directly through the
 * `PrimitivesRenderer` fast-paths:
 *
 * - **Nodes** — `renderer.updateShape(id, { radius | width+height, stroke })`
 *   is a partial merge that just calls `shape.draw(spec)` on the same
 *   pixi Graphics. No destroy/create, no scene-graph churn.
 * - **Edges** — `renderer.setConnectorStroke(id, { color, width })` patches
 *   the spec and redraws on the **cached path**. Crucially, it skips the
 *   per-edge `recomputeConnectorPath`, which would otherwise iterate every
 *   shape in the renderer to build an obstacle list — `O(edges × shapes)`
 *   per reflow and lethal during continuous zoom.
 *
 * The data store stays at the original world-unit values. This behaviour
 * is a presentation-layer override — consumers reading `node.data.size`
 * see the original; only the rendered geometry changes.
 *
 * ## MapLibre note
 *
 * `MapLayer` writes the pixi-viewport transform directly (it mirrors
 * MapLibre's exact camera). `Camera`'s `camera:zoom` event only fires
 * because `MapLayer.syncCameraFromMap` explicitly re-emits it after each
 * move. Without that bridge, this behaviour would silently never trigger
 * under MapLibre's zoom gesture.
 *
 * ## Supported shape kinds
 *
 * `circle` and `rect` node shapes scale cleanly. `arc` is skipped — its
 * geometry is in `innerR` / `outerR` / sweep angles and doesn't map to a
 * single screen-px input.
 */

import {
  Behaviour,
  type BehaviourOptions,
  type CanvasContext,
  type PrimitivesRenderer,
} from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';

type NumberOrGetter = number | (() => number);

function resolve(v: NumberOrGetter | undefined): number | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'function' ? v() : v;
}

function readNumber(data: unknown, field: string): number | undefined {
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

/** Per-`GraphLayer` rescale config. */
export interface GraphLayerScaleConfig {
  /** Required — the `GraphLayer` whose entities are rescaled. */
  layerId: string;

  /**
   * Node rescaling. Omit to leave nodes in world units. When present,
   * `sizePx` rescales body diameter (circle) / width+height (rect);
   * `strokeWidthPx` rescales the outline if set (otherwise outline
   * stays in world units).
   */
  nodes?: {
    sizePx?: NumberOrGetter;
    strokeWidthPx?: NumberOrGetter;
  };

  /**
   * Edge rescaling. Omit to leave edge stroke widths in world units.
   * When present, `strokeWidthPx` rescales every edge's connector
   * stroke width.
   */
  edges?: {
    strokeWidthPx?: NumberOrGetter;
  };
}

export interface ScreenSizeBehaviourOptions extends BehaviourOptions {
  /** One config per `GraphLayer` the behaviour drives. */
  layers: GraphLayerScaleConfig[];
}

interface ResolvedLayer {
  config: GraphLayerScaleConfig;
  layer: GraphLayer;
}

export class ScreenSizeBehaviour extends Behaviour {
  private readonly configs: GraphLayerScaleConfig[];
  private resolved: ResolvedLayer[] = [];
  private readonly subs: Array<() => void> = [];
  /**
   * Pending `requestAnimationFrame` handle. Non-null while a reflow is
   * scheduled but hasn't fired yet — collapses bursts of `camera:zoom`
   * events into one reflow per animation frame. Critical for keeping
   * fps above 60 during a continuous wheel-zoom over thousands of
   * entities (the gesture can fire 100+ events per second).
   */
  private rafHandle: number | null = null;

  constructor(opts: ScreenSizeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.configs = opts.layers.slice();
  }

  protected override onRegister(ctx: CanvasContext): void {
    for (const config of this.configs) {
      const layer = ctx.layers.get<GraphLayer>(config.layerId);
      if (!layer) {
        throw new Error(
          `ScreenSizeBehaviour "${this.id}": layer "${config.layerId}" not found in CanvasContext.`,
        );
      }
      this.resolved.push({ config, layer });
    }

    this.subs.push(ctx.events.on('camera:zoom', () => this.scheduleReflow()));

    if (this.isEnabled) this.writeAtScale(ctx.camera.scale);
  }

  protected override onDestroy(): void {
    this.cancelScheduledReflow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.resolved = [];
  }

  protected override onEnable(): void {
    if (!this.ctx) return;
    this.writeAtScale(this.ctx.camera.scale);
  }

  protected override onDisable(): void {
    // Disable is reversible — cancel pending work and put every entity
    // back at its original world-unit size (scale = 1).
    this.cancelScheduledReflow();
    this.writeAtScale(1);
  }

  /**
   * Force an immediate reflow at the current camera scale. Call after
   * tuning a config knob (e.g. moving a GUI slider) to push the new
   * sizes without waiting for the next zoom event.
   */
  reflow(): void {
    this.cancelScheduledReflow();
    if (!this.isEnabled || !this.ctx) return;
    this.writeAtScale(this.ctx.camera.scale);
  }

  private scheduleReflow(): void {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      if (!this.isEnabled || !this.ctx) return;
      this.writeAtScale(this.ctx.camera.scale);
    });
  }

  private cancelScheduledReflow(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private writeAtScale(rawScale: number): void {
    const scale = Math.max(rawScale, 1e-6);
    for (const { config, layer } of this.resolved) {
      const renderer = layer.getRenderer();
      if (!renderer) continue;
      if (config.nodes) this.writeNodes(layer, renderer, scale, config.nodes);
      if (config.edges) this.writeEdges(layer, renderer, scale, config.edges);
    }
  }

  private writeNodes(
    layer: GraphLayer,
    renderer: PrimitivesRenderer,
    scale: number,
    cfg: NonNullable<GraphLayerScaleConfig['nodes']>,
  ): void {
    const defaults = layer.getNodeDefaults();
    const fallbackSizePx = resolve(cfg.sizePx) ?? defaults.size;
    const fallbackSwPx = resolve(cfg.strokeWidthPx);
    const defaultStrokeColor = typeof defaults.stroke === 'number' ? defaults.stroke : undefined;

    for (const node of layer.store.nodes()) {
      const data = node.data;
      const kind = readShapeKind(data) ?? defaults.shape;
      if (kind === 'arc') continue;

      // Per-node `data.size` always wins over the behaviour's fallback —
      // matches the resolution order used everywhere else in GraphLayer.
      const baseSize = readNumber(data, 'size') ?? fallbackSizePx;
      const worldSize = baseSize / scale;

      const partial: Record<string, unknown> = {};
      if (kind === 'circle') {
        partial.radius = worldSize / 2;
      } else {
        // rect
        partial.width = worldSize;
        const baseHeight = readNumber(data, 'height') ?? baseSize;
        partial.height = baseHeight / scale;
      }

      if (fallbackSwPx !== undefined) {
        const baseSw = readNumber(data, 'strokeWidth') ?? fallbackSwPx;
        const strokeColor = readNumber(data, 'stroke') ?? defaultStrokeColor;
        // Skip stroke entirely when explicitly disabled (`stroke: false`
        // on the node data) — partial-merging `{ color: undefined, width }`
        // would produce a junk stroke spec at draw time.
        const strokeDisabled = data && (data as Record<string, unknown>).stroke === false;
        if (strokeColor !== undefined && !strokeDisabled) {
          partial.stroke = { color: strokeColor, width: baseSw / scale };
        }
      }

      renderer.updateShape(node.id, partial);
    }
  }

  private writeEdges(
    layer: GraphLayer,
    renderer: PrimitivesRenderer,
    scale: number,
    cfg: NonNullable<GraphLayerScaleConfig['edges']>,
  ): void {
    const defaults = layer.getEdgeDefaults();
    const fallbackSwPx = resolve(cfg.strokeWidthPx) ?? defaults.strokeWidth;

    for (const edge of layer.store.edges()) {
      const data = edge.data;
      const baseSw = readNumber(data, 'strokeWidth') ?? fallbackSwPx;
      const strokeColor = readNumber(data, 'stroke') ?? defaults.stroke;
      renderer.setConnectorStroke(edge.id, {
        color: strokeColor,
        width: baseSw / scale,
      });
    }
  }
}
