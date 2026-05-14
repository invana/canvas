/**
 * `LabelCollisionBehaviour` — hides overlapping node / edge labels via a
 * greedy priority-sorted sweep so dense graphs stay legible.
 *
 * Strategy: each pass collects every label's world-space AABB, sorts the
 * label set by `priority` (configurable resolver — `priority` field on the
 * style, node-degree, or a custom callback), and walks high-to-low. A label
 * is **shown** if its AABB doesn't overlap any label already shown in the
 * same `collisionGroup`; otherwise it's hidden for this frame. Labels with
 * `forceShow: true` skip the check entirely (use for hovered / selected
 * elements).
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
 *     layerId: 'graph',
 *     enabled: true,
 *     prioritise: 'node-degree',
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext, type Rect } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeLabelHint, NodeLabelHint } from '../layer/types';

/** What the behaviour does with an overlap. `'hide'` is the only strategy in v0. */
export type LabelCollisionStrategy = 'hide';

/** How label priority is resolved when sorting. */
export type LabelPriorityResolver =
  | 'priority-field'   // read `priority` from the label style (default)
  | 'node-degree'      // higher node degree wins; edges fall back to 0
  | ((kind: 'node' | 'edge', id: string) => number);

export interface LabelCollisionBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  layerId: string;

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
  private opts: ResolvedOptions;

  /** Last-flip timestamp per label id (perf.now()). */
  private readonly lastFlip = new Map<string, number>();
  /** Last visibility decision per label id. */
  private readonly lastVisible = new Map<string, boolean>();

  /** Subscription disposers, called in onDestroy. */
  private subs: Array<() => void> = [];

  /** Coalesce repeated triggers within a single frame. */
  private scheduled = false;

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
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `LabelCollisionBehaviour "${this.id}": layer "${this.layerId}" not found.`,
      );
    }
    this.layer = layer;

    // Recompute on data churn — labels appear / disappear / move when the
    // store emits a flush after a batch of node / edge inserts or updates.
    const offFlush = layer.store.events.on('flush', () => this.schedule());
    this.subs.push(offFlush);

    // Recompute on camera change — zoom alters effective overlap, pan can
    // bring previously-out-of-viewport labels into bounds (and vice versa).
    const bus = ctx.events;
    const onCameraChange = (): void => this.schedule();
    bus.on('camera:zoom', onCameraChange);
    bus.on('camera:pan', onCameraChange);
    this.subs.push(
      () => bus.off('camera:zoom', onCameraChange),
      () => bus.off('camera:pan', onCameraChange),
    );

    // Initial sweep.
    if (this.enabled) this.schedule();
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.lastFlip.clear();
    this.lastVisible.clear();
    this.layer = null;
  }

  protected override onEnable(): void {
    this.schedule();
  }

  protected override onDisable(): void {
    // Restore every previously-hidden label so the visual state is clean.
    if (!this.layer) return;
    const r = this.layer.getRenderer();
    if (!r) return;
    for (const id of this.lastVisible.keys()) r.setDecorationVisible(id, 'label', true);
    this.lastVisible.clear();
    this.lastFlip.clear();
  }

  /** Coalesce repeated triggers within a microtask. Cheap; runs at most once per frame. */
  private schedule(): void {
    if (!this.enabled || this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.runPass();
    });
  }

  /**
   * Walk every label, sort by priority, greedy-hide overlaps within the
   * same `collisionGroup`. Mutates label `gfx.visible`; doesn't touch
   * decoration state otherwise.
   */
  private runPass(): void {
    if (!this.enabled) return;
    const layer = this.layer;
    if (!layer) return;
    const renderer = layer.getRenderer();
    if (!renderer) return;

    const records: LabelRecord[] = [];

    for (const node of layer.store.nodes()) {
      const labelHint = (node.data as { label?: NodeLabelHint } | undefined)?.label;
      if (labelHint === undefined) continue;
      const b = renderer.getDecorationWorldBounds(node.id, 'label');
      if (!b || b.width === 0 || b.height === 0) continue;
      records.push({
        kind: 'node',
        id: node.id,
        bounds: b,
        priority: this.priorityFor('node', node.id, labelHint),
        group: groupOf(labelHint) ?? this.opts.nodeGroup,
        forceShow: forceShowOf(labelHint),
      });
    }

    for (const edge of layer.store.edges()) {
      const labelHint = (edge.data as { label?: EdgeLabelHint } | undefined)?.label;
      if (labelHint === undefined) continue;
      const b = renderer.getDecorationWorldBounds(edge.id, 'label');
      if (!b || b.width === 0 || b.height === 0) continue;
      records.push({
        kind: 'edge',
        id: edge.id,
        bounds: b,
        priority: this.priorityFor('edge', edge.id, labelHint),
        group: groupOf(labelHint) ?? this.opts.edgeGroup,
        forceShow: forceShowOf(labelHint),
      });
    }

    records.sort((a, b) => b.priority - a.priority);

    const shownByGroup = new Map<string, LabelRecord[]>();
    const now = performance.now();

    for (const rec of records) {
      let show: boolean;
      if (rec.forceShow) {
        show = true;
      } else {
        const group = shownByGroup.get(rec.group);
        show = !group || !group.some((r) => intersects(r.bounds, rec.bounds));
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
        let g = shownByGroup.get(rec.group);
        if (!g) {
          g = [];
          shownByGroup.set(rec.group, g);
        }
        g.push(rec);
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
    hint: NodeLabelHint | EdgeLabelHint,
  ): number {
    const resolver = this.opts.prioritise;
    if (typeof resolver === 'function') return resolver(kind, id);
    if (resolver === 'priority-field') {
      const explicit = priorityOf(hint);
      if (explicit !== undefined) return explicit;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function priorityOf(hint: NodeLabelHint | EdgeLabelHint): number | undefined {
  if (typeof hint === 'string') return undefined;
  return hint.priority;
}

function groupOf(hint: NodeLabelHint | EdgeLabelHint): string | undefined {
  if (typeof hint === 'string') return undefined;
  return hint.collisionGroup;
}

function forceShowOf(hint: NodeLabelHint | EdgeLabelHint): boolean {
  if (typeof hint === 'string') return false;
  return hint.forceShow === true;
}
