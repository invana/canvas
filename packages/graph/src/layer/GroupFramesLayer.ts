/**
 * `GroupFramesLayer` — a `WorldLayer` that paints one rectangular **frame** round
 * each declared set of a `GraphLayer`'s nodes, without the frame being a node.
 *
 * A frame is scenery read off its members' positions: it never re-parents a
 * node, never takes part in a layout, is never data (export, counts, undo) and
 * follows its members through layouts, drags and live simulation.
 *
 * | Frame field | What it does |
 * |---|---|
 * | `members` | the node ids it wraps; hidden and collapsed-away ones are skipped |
 * | `label` | the header text, drawn at the frame's top-left |
 * | `color` | stroke and wash colour |
 * | `dashed` | a dashed stroke — e.g. some members are not on the board |
 *
 * **Cost.** Each frame the layer compares the graph store's `version` with the
 * last one it painted; unchanged, it does nothing. Changed, it reads only the
 * members' positions and cached sizes — never the whole graph — and republishes
 * a frame only when its rectangle moved by more than half a pixel. The header
 * is a separate shape, so a frame that grows retraces one rect and its label is
 * only moved. With no frames the hook returns at once.
 *
 * ```ts
 * const frames = new GroupFramesLayer({ id: 'frames', zIndex: -1, options: { graphLayerId: 'graph' } });
 * canvas.layers.add(frames);
 * frames.setFrames([{ id: 'g1', members: ['a', 'b'], label: 'Hubs · 2 records', color: 0x2563eb }]);
 * ```
 *
 * Add it **below** the graph layer (`zIndex` under the graph's), so records paint
 * on top of their frame. A click on a frame's header is `frame:click`.
 */

import { SpecProjector, WorldLayer } from '@invana/canvas';
import type { BaseShapeSpec, CanvasContext, CompositeSpec, LayerOptions, RectSpec, SpecStore, WorldLayerHit } from '@invana/canvas';

import { GraphLayer } from './GraphLayer';

/** One frame round a set of nodes. */
export interface GroupFrame {
  readonly id: string;
  readonly members: readonly string[];
  readonly label?: string;
  readonly color: number;
  /** Header text colour. Default: {@link color}. */
  readonly labelColor?: number;
  readonly dashed?: boolean;
}

/** Constructor options for {@link GroupFramesLayer}. */
export interface GroupFramesLayerOptions {
  /** The `GraphLayer` whose nodes the frames wrap. */
  readonly graphLayerId: string;
  /** Space between the members' bounds and the frame. Default `22`. */
  readonly padding?: number;
  /** Height of the header band above the members. Default `22`. */
  readonly headerHeight?: number;
  /** Wash alpha inside the frame. Default `0.06`. */
  readonly fillAlpha?: number;
}

/** What a {@link GroupFramesLayer} tells its host. */
export type GroupFramesLayerEvents = {
  /** A frame's header was clicked. */
  'frame:click': { frameId: string };
};

/** A frame header hit: `frameId` is the {@link GroupFrame.id}. */
export interface GroupFrameHit extends WorldLayerHit {
  readonly frameId: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FONT_SIZE = 11;
/** Rough header width per character — the hit band, not the drawn text. */
const CHAR_W = 6.4;

export class GroupFramesLayer extends WorldLayer<GroupFramesLayerOptions, object, GroupFramesLayerEvents, never, GroupFrameHit> {
  override readonly kind = 'group-frames-layer';
  private readonly graphLayerId: string;
  private frames: GroupFrame[] = [];
  private specs: SpecStore<BaseShapeSpec> | null = null;
  private projector: SpecProjector<BaseShapeSpec> | null = null;
  /** The rectangle each frame was last painted at. */
  private painted = new Map<string, Box>();
  /** Store version last painted; `-1` forces the next frame to paint. */
  private seen = -1;
  private seenStore: object | null = null;
  private offClick: (() => void) | null = null;
  /** The zoom tier the headers were last rastered at. */
  private labelTier = 0;

  constructor(opts: LayerOptions<GroupFramesLayerOptions>) {
    super({ ...opts, cullable: opts.cullable ?? false });
    this.graphLayerId = opts.options.graphLayerId;
  }

  protected createState(): object {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    this.specs = ctx.store.specsFor<BaseShapeSpec>(this.id);
    this.projector = new SpecProjector(this.specs, this.surface.primitives);
    // Only a header is a target: a click anywhere else on a frame does nothing.
    this.offClick = this.surface.primitives.events.on('shape:click', ({ worldX, worldY }: { worldX: number; worldY: number }) => {
      const hit = this.hitTest(worldX, worldY);
      if (hit) this.events.emit('frame:click', { frameId: hit.frameId });
    });
    this.seen = -1;
  }

  protected override onUnmount(): void {
    this.offClick?.();
    this.offClick = null;
    this.labelTier = 0;
    this.projector?.destroy();
    this.projector = null;
    this.specs?.clear();
    this.specs = null;
    this.painted.clear();
  }

  /** Replace every frame. Frames no longer listed are removed. */
  setFrames(frames: readonly GroupFrame[]): void {
    this.frames = [...frames];
    const keep = new Set(frames.map((f) => f.id));
    for (const id of [...this.painted.keys()]) if (!keep.has(id)) this.retire(id);
    // A changed label, colour or member list repaints even at the same place.
    this.painted.clear();
    this.seen = -1;
  }

  /** The frames as last set. */
  getFrames(): readonly GroupFrame[] {
    return this.frames;
  }

  /** The frame whose header band holds the world point, if any. */
  hitTest(worldX: number, worldY: number): GroupFrameHit | null {
    const head = this.options.headerHeight ?? 22;
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const f = this.frames[i]!;
      const b = this.painted.get(f.id);
      if (!b) continue;
      const w = Math.min(b.w, 20 + (f.label?.length ?? 0) * CHAR_W);
      if (worldX >= b.x && worldX <= b.x + w && worldY >= b.y && worldY <= b.y + head) {
        return { id: f.id, frameId: f.id };
      }
    }
    return null;
  }

  /** A frame's rectangle in world space as last painted. */
  frameBounds(id: string): { x: number; y: number; width: number; height: number } | null {
    const b = this.painted.get(id);
    return b ? { x: b.x, y: b.y, width: b.w, height: b.h } : null;
  }

  /** Called by the canvas every frame, after the data flush. */
  tickAnimations(dt: number): void {
    this.surface.primitives.tickAnimations?.(dt);
    if (this.frames.length === 0) return;
    this.crispLabels();
    // Looked up each frame: a host that replaces its graph layer is followed.
    const graph = this.ctx?.layers.get<GraphLayer>(this.graphLayerId);
    if (!(graph instanceof GraphLayer)) return;
    const version = graph.store.version;
    if (version === this.seen && graph.store === this.seenStore) return;
    this.seen = version;
    this.seenStore = graph.store;
    for (const f of this.frames) this.paint(f, graph);
  }

  /**
   * Re-raster the headers when the zoom crosses a tier (DPR × 1, 2, 4, 8), so
   * they stay sharp up close. Within a tier this is one compare.
   */
  private crispLabels(): void {
    const scale = this.ctx?.camera.scale ?? 1;
    const tier = Math.min(8, 2 ** Math.max(0, Math.ceil(Math.log2(scale))));
    if (tier === this.labelTier) return;
    this.labelTier = tier;
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    this.surface.primitives.setLabelsResolution(dpr * tier);
  }

  private paint(f: GroupFrame, graph: GraphLayer): void {
    const box = this.membersBox(f, graph);
    if (!box) {
      this.retire(f.id);
      return;
    }
    const pad = this.options.padding ?? 22;
    const head = this.options.headerHeight ?? 22;
    const next: Box = { x: box.x - pad, y: box.y - pad - head, w: box.w + pad * 2, h: box.h + pad * 2 + head };
    const prev = this.painted.get(f.id);
    if (prev && near(prev, next)) return;
    this.painted.set(f.id, next);
    const specs = this.specs!;
    const bodyId = `${this.id}:frame:${f.id}`;
    const headId = `${this.id}:head:${f.id}`;
    const resized = !prev || Math.abs(prev.w - next.w) > 0.5 || Math.abs(prev.h - next.h) > 0.5;
    if (resized || !specs.get(bodyId)) {
      const body: RectSpec = {
        kind: 'rect',
        x: next.x,
        y: next.y,
        width: next.w,
        height: next.h,
        cornerRadius: 8,
        fill: [{ kind: 'solid', color: f.color, alpha: this.options.fillAlpha ?? 0.06 }],
        stroke: { color: f.color, width: 1.5, alignment: 'inside', ...(f.dashed ? { dashArray: [5, 4] as const } : {}) },
      };
      specs.set(bodyId, body);
    } else {
      specs.set(bodyId, { ...specs.get(bodyId)!, x: next.x, y: next.y });
    }
    this.projector?.project(bodyId);
    if (f.label) {
      const have = specs.get(headId) as CompositeSpec | undefined;
      const text = have?.parts[0]?.part === 'label' ? have.parts[0].text : undefined;
      const header: CompositeSpec =
        have && text === f.label
          ? { ...have, x: next.x, y: next.y }
          : {
              kind: 'composite',
              x: next.x,
              y: next.y,
              width: Math.max(40, 20 + f.label.length * CHAR_W),
              height: head,
              parts: [{ part: 'label', x: 10, y: head / 2, vAnchor: 'middle', text: f.label, fontSize: FONT_SIZE, fontWeight: 700, fill: f.labelColor ?? f.color }],
            };
      specs.set(headId, header);
      this.projector?.project(headId);
    } else if (specs.get(headId)) {
      specs.delete(headId);
      this.projector?.unproject(headId);
    }
  }

  /** The members' bounds in world space, from positions and cached sizes. */
  private membersBox(f: GroupFrame, graph: GraphLayer): Box | null {
    const store = graph.store;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const id of f.members) {
      const n = store.getNode(id);
      const p = n ? store.getPosition(id) : undefined;
      if (!n || !p || n.hidden || graph.collapsedAncestor(id) !== undefined) continue;
      const w = n.boundingBox?.width ?? 20;
      const h = n.boundingBox?.height ?? 20;
      x0 = Math.min(x0, p.x - w / 2);
      y0 = Math.min(y0, p.y - h / 2);
      x1 = Math.max(x1, p.x + w / 2);
      y1 = Math.max(y1, p.y + h / 2);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  private retire(id: string): void {
    this.painted.delete(id);
    for (const sid of [`${this.id}:frame:${id}`, `${this.id}:head:${id}`]) {
      if (!this.specs?.get(sid)) continue;
      this.specs.delete(sid);
      this.projector?.unproject(sid);
    }
  }
}

function near(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.w - b.w) <= 0.5 && Math.abs(a.h - b.h) <= 0.5;
}
