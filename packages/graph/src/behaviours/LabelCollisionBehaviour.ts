/**
 * `LabelCollisionBehaviour` — hides overlapping node / edge labels via a
 * greedy priority-sorted sweep so dense graphs stay legible.
 *
 * Strategy: each pass collects the world-space AABB of every label **inside the
 * current viewport** (off-screen labels are skipped — they're culled and unseen),
 * sorts that set by `priority` (configurable resolver — `priority` field on the
 * style, node-degree, or a custom callback), and walks high-to-low. A label is
 * **shown** if its AABB doesn't overlap any label already shown in the same
 * `collisionGroup`; otherwise it's hidden for this frame. Overlap is tested
 * against an **rbush spatial index** per group (an already-shown label is
 * inserted into its group's index), so the pass is `O(n log n)` rather than the
 * `O(n²)` of a pairwise scan — the difference between smooth and janky pan/zoom
 * on dense graphs. Labels with `forceShow: true` skip the check entirely (use
 * for hovered / selected elements).
 *
 * Default groups partition node labels and edge labels — a node label never
 * loses to an edge label of higher priority.
 *
 * The behaviour reruns on every store flush (data churn) and on every
 * `camera:zoom` / `camera:pan` event (viewport churn). A small hysteresis
 * timer keeps just-flipped labels from immediately flipping back when zoom
 * leaves them right on the overlap boundary.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new LabelCollisionBehaviour({
 *     id: 'label-collision',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     prioritise: 'node-degree',
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext, type Rect } from '@invana/canvas';
import RBush from 'rbush';

import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeStyle, NodeStyle } from '../layer/types';

/**
 * Fraction of the viewport, per axis, that the collision pass reaches beyond the
 * visible bounds. A small margin so a label straddling the edge is resolved
 * before it fully scrolls in (no pop), without processing the whole world.
 */
const VIEWPORT_PAD = 0.2;

/**
 * Minimum gap between collision passes while a gesture streams events. The pass
 * still runs on the leading edge and once more on the trailing edge (settle), so
 * the final state is always correct; in between it runs at most ~11 Hz instead
 * of once per frame — labels shift while panning/zooming anyway, so a slightly
 * stale hide-set mid-gesture is imperceptible. Mirrors the settle convention the
 * scale-LOD behaviours use.
 */
const COLLISION_THROTTLE_MS = 90;

/** rbush item — a label's AABB in world space. */
interface LabelBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const toBBox = (b: Rect): LabelBBox => ({
  minX: b.x,
  minY: b.y,
  maxX: b.x + b.width,
  maxY: b.y + b.height,
});

/** Subset of label settings the collision pass needs — pulled from a
 * resolved {@link NodeStyle} / {@link EdgeStyle} via flat label fields or
 * the `labelStyle` escape hatch. */
interface LabelSettings {
  readonly priority?: number;
  readonly collisionGroup?: string;
  readonly forceShow?: boolean;
}

function labelSettingsFromStyle(
  style: Partial<NodeStyle> | Partial<EdgeStyle>,
): LabelSettings | undefined {
  const hasFlat =
    style.labelText !== undefined
    || style.labelPriority !== undefined
    || style.labelCollisionGroup !== undefined
    || style.labelForceShow !== undefined;
  if (style.labelStyle === undefined && !hasFlat) return undefined;

  const ls = style.labelStyle;
  return {
    priority: style.labelPriority ?? ls?.priority,
    collisionGroup: style.labelCollisionGroup ?? ls?.collisionGroup,
    forceShow: style.labelForceShow ?? ls?.forceShow,
  };
}

/** What the behaviour does with an overlap. `'hide'` is the only strategy in v0. */
export type LabelCollisionStrategy = 'hide';

/** How label priority is resolved when sorting. */
export type LabelPriorityResolver =
  | 'priority-field'   // read `priority` from the label style (default)
  | 'node-degree'      // higher node degree wins; edges fall back to 0
  | ((kind: 'node' | 'edge', id: string) => number);

export interface LabelCollisionBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;

  /** Default `'hide'`. */
  strategy?: LabelCollisionStrategy;

  /** Default `'priority-field'`. Falls back to node-degree when undefined. */
  prioritise?: LabelPriorityResolver;

  /**
   * Hysteresis: a just-hidden label stays hidden for at least this many ms
   * before it can re-appear, and vice versa. Stops flicker when zoom is
   * right at an overlap boundary. Default `100`.
   */
  flickerGuardMs?: number;

  /**
   * Default `'nodes'` for node labels, `'edges'` for edge labels. Set to a
   * custom mapping if you want different partitioning (e.g. all in one
   * group so edges can win priority against nodes).
   */
  groups?: {
    nodes?: string;
    edges?: string;
  };
}

interface ResolvedOptions {
  strategy: LabelCollisionStrategy;
  prioritise: LabelPriorityResolver;
  flickerGuardMs: number;
  nodeGroup: string;
  edgeGroup: string;
}

interface LabelRecord {
  kind: 'node' | 'edge';
  id: string;
  bounds: Rect;
  priority: number;
  group: string;
  forceShow: boolean;
}

export class LabelCollisionBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  /** Camera — read for the visible world bounds each pass (viewport-scoping). */
  private camera: CanvasContext['camera'] | null = null;
  private opts: ResolvedOptions;

  /** Last-flip timestamp per label id (perf.now()). */
  private readonly lastFlip = new Map<string, number>();
  /** Last visibility decision per label id. */
  private readonly lastVisible = new Map<string, boolean>();

  /** Subscription disposers, called in onDestroy. */
  private subs: Array<() => void> = [];

  /** Coalesce repeated triggers within a single frame. */
  private scheduled = false;
  /** `performance.now()` of the last pass — throttles passes during a gesture. */
  private lastRunAt = 0;
  /** Pending trailing-edge pass (settle), or `null`. */
  private trailingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: LabelCollisionBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = {
      strategy: opts.strategy ?? 'hide',
      prioritise: opts.prioritise ?? 'priority-field',
      flickerGuardMs: opts.flickerGuardMs ?? 100,
      nodeGroup: opts.groups?.nodes ?? 'nodes',
      edgeGroup: opts.groups?.edges ?? 'edges',
    };
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `LabelCollisionBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`,
      );
    }
    this.layer = layer;
    this.camera = ctx.camera;

    // Recompute on data churn — labels appear / disappear / move when the
    // store emits a flush after a batch of node / edge inserts or updates.
    const offFlush = layer.store.events.on('flush', () => this.schedule());
    this.subs.push(offFlush);

    // Recompute on camera change — zoom alters effective overlap, pan can
    // bring previously-out-of-viewport labels into bounds (and vice versa).
    const bus = ctx.events;
    const onCameraChange = (): void => this.schedule();
    bus.on('input:camera:zoom', onCameraChange);
    bus.on('input:camera:pan', onCameraChange);
    this.subs.push(
      () => bus.off('input:camera:zoom', onCameraChange),
      () => bus.off('input:camera:pan', onCameraChange),
    );

    // Initial sweep.
    if (this.enabled) this.schedule();
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.trailingTimer !== null) {
      clearTimeout(this.trailingTimer);
      this.trailingTimer = null;
    }
    this.lastFlip.clear();
    this.lastVisible.clear();
    this.layer = null;
    this.camera = null;
  }

  protected override onEnable(): void {
    this.schedule();
  }

  protected override onDisable(): void {
    // Cancel any pending trailing pass and reset the throttle so a re-enable
    // runs immediately.
    if (this.trailingTimer !== null) {
      clearTimeout(this.trailingTimer);
      this.trailingTimer = null;
    }
    this.lastRunAt = 0;
    // Restore every previously-hidden label so the visual state is clean.
    if (!this.layer) return;
    const r = this.layer.getRenderer();
    if (!r) return;
    for (const id of this.lastVisible.keys()) r.setDecorationVisible(id, 'label', true);
    this.lastVisible.clear();
    this.lastFlip.clear();
  }

  /**
   * Throttle passes during a gesture: run on the leading edge, then at most once
   * per {@link COLLISION_THROTTLE_MS} while events keep streaming, with a
   * guaranteed trailing pass after they stop (settle). Off a gesture (a lone
   * flush / the first event) this runs immediately.
   */
  private schedule(): void {
    if (!this.enabled) return;
    const elapsed = performance.now() - this.lastRunAt;
    if (this.lastRunAt === 0 || elapsed >= COLLISION_THROTTLE_MS) {
      this.runSoon();
    } else if (this.trailingTimer === null) {
      // Within the throttle window — defer to its boundary. One pending timer
      // (not reset per event) gives both mid-gesture updates and a final settle.
      this.trailingTimer = setTimeout(() => {
        this.trailingTimer = null;
        this.runSoon();
      }, COLLISION_THROTTLE_MS - elapsed);
    }
  }

  /** Coalesce a single pass into a microtask; stamps `lastRunAt`. */
  private runSoon(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.lastRunAt = performance.now();
      this.runPass();
    });
  }

  /**
   * Collect the in-viewport labels, sort by priority, and greedy-hide overlaps
   * within each `collisionGroup` using a per-group rbush index. Mutates label
   * `gfx.visible` via `setDecorationVisible`; doesn't touch decoration state
   * otherwise.
   */
  private runPass(): void {
    if (!this.enabled) return;
    const layer = this.layer;
    if (!layer) return;
    const renderer = layer.getRenderer();
    if (!renderer) return;

    // Viewport-scope: skip labels outside the padded visible bounds. They're
    // culled and unseen, so resolving them wastes the whole pass on dense
    // graphs; `inView` accepts everything when no camera bounds are available.
    const view = this.camera?.getVisibleBounds();
    const padX = view ? view.width * VIEWPORT_PAD : 0;
    const padY = view ? view.height * VIEWPORT_PAD : 0;
    const inView = (b: Rect): boolean =>
      !view ||
      (b.x < view.x + view.width + padX &&
        b.x + b.width > view.x - padX &&
        b.y < view.y + view.height + padY &&
        b.y + b.height > view.y - padY);

    const records: LabelRecord[] = [];

    for (const node of layer.store.nodes()) {
      if (node.hidden === true) continue; // hidden nodes have no visible label
      const settings = labelSettingsFromStyle(layer.resolveNodeStyle(node));
      if (settings === undefined) continue;
      const b = renderer.getDecorationWorldBounds(node.id, 'label');
      if (!b || b.width === 0 || b.height === 0) continue;
      if (!inView(b)) continue;
      records.push({
        kind: 'node',
        id: node.id,
        bounds: b,
        priority: this.priorityFor('node', node.id, settings),
        group: settings.collisionGroup ?? this.opts.nodeGroup,
        forceShow: settings.forceShow === true,
      });
    }

    for (const edge of layer.store.edges()) {
      if (!layer.store.isEdgeVisible(edge.id)) continue; // hidden edge → no label
      const settings = labelSettingsFromStyle(layer.resolveEdgeStyle(edge));
      if (settings === undefined) continue;
      const b = renderer.getDecorationWorldBounds(edge.id, 'label');
      if (!b || b.width === 0 || b.height === 0) continue;
      if (!inView(b)) continue;
      records.push({
        kind: 'edge',
        id: edge.id,
        bounds: b,
        priority: this.priorityFor('edge', edge.id, settings),
        group: settings.collisionGroup ?? this.opts.edgeGroup,
        forceShow: settings.forceShow === true,
      });
    }

    records.sort((a, b) => b.priority - a.priority);

    // Already-shown labels per group, indexed spatially — an overlap test is an
    // rbush `collides` query (O(log n)) instead of scanning the whole group.
    const shownByGroup = new Map<string, RBush<LabelBBox>>();
    const now = performance.now();

    for (const rec of records) {
      const box = toBBox(rec.bounds);
      let show: boolean;
      if (rec.forceShow) {
        show = true;
      } else {
        const index = shownByGroup.get(rec.group);
        show = !index || !index.collides(box);
      }

      // Hysteresis: don't flip again if we just flipped recently.
      const last = this.lastVisible.get(rec.id);
      if (last !== undefined && last !== show) {
        const since = now - (this.lastFlip.get(rec.id) ?? 0);
        if (since < this.opts.flickerGuardMs) {
          show = last;
        }
      }

      if (show) {
        let index = shownByGroup.get(rec.group);
        if (!index) {
          index = new RBush<LabelBBox>();
          shownByGroup.set(rec.group, index);
        }
        index.insert(box);
      }

      if (this.lastVisible.get(rec.id) !== show) {
        this.lastFlip.set(rec.id, now);
        this.lastVisible.set(rec.id, show);
        renderer.setDecorationVisible(rec.id, 'label', show);
      }
    }
  }

  private priorityFor(
    kind: 'node' | 'edge',
    id: string,
    settings: LabelSettings,
  ): number {
    const resolver = this.opts.prioritise;
    if (typeof resolver === 'function') return resolver(kind, id);
    if (resolver === 'priority-field') {
      if (settings.priority !== undefined) return settings.priority;
      // Fallback: degree for nodes, 0 for edges (edge labels rarely have a
      // natural ranking; consumers pass a function when they want one).
      return kind === 'node' ? this.degreeOf(id) : 0;
    }
    // resolver === 'node-degree'
    return kind === 'node' ? this.degreeOf(id) : 0;
  }

  private degreeOf(nodeId: string): number {
    if (!this.layer) return 0;
    let n = 0;
    for (const _ of this.layer.store.edgesOf(nodeId, 'both')) n++;
    return n;
  }
}

