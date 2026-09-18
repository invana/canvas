/**
 * `EntranceBehaviour` — the graph *arrives* instead of appearing.
 *
 * A canvas whose nodes are placed by a layout has no first frame worth
 * watching: the scene is empty, then it is complete. This behaviour fades each
 * element in once, with a per-item delay, so the diagram lands in an order you
 * chose — left-to-right for a flow, top-down for a tree — rather than all at
 * once.
 *
 * ### What it writes
 *
 * Per-item `style.effects` entries: `'fade-in'` on nodes, `'fade-in-connector'`
 * on edges (the renderer's two one-shot opacity effects). Each carries its own
 * `delayMs`, which is the whole mechanism — one fade is a flash, a hundred
 * staggered fades is an entrance. When the sweep is over the behaviour
 * **removes** the effects again, so a transient animation never settles into
 * exported state.
 *
 * This is ordinary styling: the effects go through `GraphStore.updateNode` and
 * are projected by `GraphLayer.syncNodeEffects` like any other declared style.
 * Nothing here talks to the renderer.
 *
 * ### When it plays
 *
 * Once, on the first frame the scene is worth showing:
 *
 * - with an `activeLayout`, when that layout reports `layout:run:end`
 *   (`'settled'`) — the moment the nodes are where they belong, and the same
 *   signal the engine's auto-fit waits for;
 * - with no layout, on the first data the layer receives.
 *
 * Enabling the behaviour while a layout is still pending does **not** play it
 * early: a sweep ordered by position is meaningless before anything has a
 * position, and it would be over before the graph arrived.
 *
 * Re-layouts, data updates and theme changes never replay it: an entrance that
 * fires twice is an animation tax, not a welcome. Disable and re-enable (or
 * call {@link EntranceBehaviour.replay}) to see it again.
 *
 * Default `enabled: false` — register, then explicitly enable (root rule 7).
 *
 * ### Known gap
 *
 * A node's **badge** is its own shape instance, not a child of the node's
 * container, so a host-alpha effect does not cascade to it: a badged node fades
 * in while its badge is already opaque.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext, type EasingName } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { NodeStyle, EdgeStyle } from '../layer/types';

/** Which axis the sweep runs along. `'none'` fades everything together. */
export type EntranceOrder = 'x' | 'y' | 'none';

export interface EntranceBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour animates. */
  targetLayerId: string;
  /** Fade length per item, in ms. Default `320`. */
  durationMs?: number;
  /**
   * Delay added per item along {@link EntranceBehaviourOptions.order}, in ms.
   * `0` fades everything together. Default `24`.
   */
  staggerMs?: number;
  /**
   * Ceiling on the whole sweep, in ms. With many items the per-item step is
   * compressed to fit, so a 2,000-node graph doesn't take a minute to arrive.
   * Default `600`.
   */
  maxStaggerMs?: number;
  /**
   * Sweep direction. `'x'` reads left-to-right (right for a `direction: 'RIGHT'`
   * layout), `'y'` top-down, `'none'` disables the stagger. Default `'x'`.
   */
  order?: EntranceOrder;
  /**
   * Fade edges as well, each one behind the later of its two endpoints so a
   * connector never arrives before the things it connects. Default `true`.
   */
  includeEdges?: boolean;
  /** Named easing — serialisable, so it rides the config bag. Default `'easeOutCubic'`. */
  easing?: EasingName;
}

/** Every option with its default filled in — what {@link EntranceBehaviour.getResolvedOptions} returns. */
export interface ResolvedEntranceOptions {
  durationMs: number;
  staggerMs: number;
  maxStaggerMs: number;
  order: EntranceOrder;
  includeEdges: boolean;
  easing: EasingName;
}

/** The `style.effects` slot this behaviour writes on a node. */
const NODE_EFFECT_KIND = 'fade-in';
/** The `style.effects` slot this behaviour writes on an edge. */
const EDGE_EFFECT_KIND = 'fade-in-connector';

/** Merge a patch over the previous resolved set (or the defaults). */
function resolveOptions(
  prev: ResolvedEntranceOptions | null,
  patch: Partial<EntranceBehaviourOptions>,
): ResolvedEntranceOptions {
  const base: ResolvedEntranceOptions = prev ?? {
    durationMs: 320,
    staggerMs: 24,
    maxStaggerMs: 600,
    order: 'x',
    includeEdges: true,
    easing: 'easeOutCubic',
  };
  return {
    durationMs: Math.max(1, patch.durationMs ?? base.durationMs),
    staggerMs: Math.max(0, patch.staggerMs ?? base.staggerMs),
    maxStaggerMs: Math.max(0, patch.maxStaggerMs ?? base.maxStaggerMs),
    order: patch.order ?? base.order,
    includeEdges: patch.includeEdges ?? base.includeEdges,
    easing: patch.easing ?? base.easing,
  };
}

/**
 * Copy an effects dict without one kind. Deleting the key (rather than setting
 * it to `null`) keeps the retired entrance out of `exportData` entirely — a
 * `null` would survive the round-trip as an explicit removal of an effect
 * nobody set.
 */
function withoutEffect(
  effects: Readonly<Record<string, unknown>>,
  kind: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(effects)) {
    if (key !== kind) out[key] = effects[key];
  }
  return out;
}

export class EntranceBehaviour extends Behaviour<EntranceBehaviourOptions> {
  override readonly kind = 'entrance';

  private layer: GraphLayer | null = null;
  private opts: ResolvedEntranceOptions;
  private readonly subs: Array<() => void> = [];
  /** Ids currently carrying an effect this behaviour wrote — what {@link clear} undoes. */
  private readonly painted: { nodes: string[]; edges: string[] } = { nodes: [], edges: [] };
  private cleanupTimer: ReturnType<typeof setTimeout> | undefined;
  private played = false;
  /**
   * `true` once the active layout has reported a settled run. Gates
   * {@link onEnable}: before it, the nodes have no meaningful positions, so a
   * position-ordered sweep would be noise.
   */
  private layoutSettled = false;

  constructor(opts: EntranceBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `EntranceBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // A layout owns placement, so it also owns *when* the picture is worth
    // showing — the same reasoning that made the engine's auto-fit wait for a
    // run rather than fitting on arm.
    this.subs.push(
      ctx.events.on('layout:run:end', ({ id, reason }) => {
        if (reason !== 'settled') return;
        if (id !== ctx.store.view.getState().definition.activeLayout) return;
        this.layoutSettled = true;
        this.play();
      }),
    );

    // No layout: the first data the layer receives is the scene.
    this.subs.push(
      layer.events.on('data:changed', () => {
        if (ctx.store.view.getState().definition.activeLayout) return;
        this.play();
      }),
    );
  }

  protected override onEnable(): void {
    // Enabling after the graph already settled (a toggle in a settings panel)
    // should still show the entrance — otherwise the control looks broken.
    // But `register()` also calls this for a behaviour constructed
    // `enabled: true`, which on first load happens *before* the layout has run:
    // playing then would sweep nodes that are all still at the origin, and be
    // finished before the graph appeared. In that case the `layout:run:end`
    // subscription is the trigger, not this.
    if (!this.layer || this.layer.store.nodeCount() === 0) return;
    const activeLayout = this.ctx?.store.view.getState().definition.activeLayout;
    if (activeLayout && !this.layoutSettled) return;
    this.play();
  }

  protected override onDisable(): void {
    this.clear();
  }

  protected override onDestroy(): void {
    this.clear();
    for (const off of this.subs.splice(0)) off();
    this.layer = null;
  }

  protected override onOptionsChanged(patch: Partial<EntranceBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /** The fully-resolved option set in use, every default filled in. */
  getResolvedOptions(): Readonly<ResolvedEntranceOptions> {
    return this.opts;
  }

  /**
   * Play the entrance again — the escape hatch for a "preview" button in a
   * settings panel, and for a consumer who re-seeds a canvas with new data and
   * wants it to arrive rather than cut.
   */
  replay(): void {
    this.clear();
    this.played = false;
    this.play();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /** Write one staggered fade per element. Once per enable; a no-op when empty. */
  private play(): void {
    if (this.played || !this.isEnabled || !this.layer) return;
    const store = this.layer.store;
    const ids = [...store.nodes()].map((n) => n.id);
    if (ids.length === 0) return;
    this.played = true;

    const { durationMs, includeEdges, easing } = this.opts;
    const delayOf = this.buildDelays(ids);
    let lastDelayMs = 0;

    for (const id of ids) {
      const prev = (store.getNode(id)?.style ?? {}) as NodeStyle;
      const delayMs = delayOf(id);
      if (delayMs > lastDelayMs) lastDelayMs = delayMs;
      store.updateNode(id, {
        style: {
          ...prev,
          // Effects are replaced wholesale, so carry any the consumer set.
          effects: { ...(prev.effects ?? {}), [NODE_EFFECT_KIND]: { durationMs, delayMs, easing } },
        } as NodeStyle,
      });
      this.painted.nodes.push(id);
    }

    if (includeEdges) {
      for (const edge of store.edges()) {
        const prev = (edge.style ?? {}) as EdgeStyle;
        // Behind the later endpoint: an edge that arrives before its nodes reads
        // as a line drawn into empty space.
        const delayMs = Math.max(delayOf(edge.source), delayOf(edge.target));
        if (delayMs > lastDelayMs) lastDelayMs = delayMs;
        store.updateEdge(edge.id, {
          style: {
            ...prev,
            effects: {
              ...(prev.effects ?? {}),
              [EDGE_EFFECT_KIND]: { durationMs, delayMs, easing },
            },
          } as EdgeStyle,
        });
        this.painted.edges.push(edge.id);
      }
    }

    // Retire the effects once the sweep is over: an entrance is transient, and
    // leaving it on the records would export it and replay it on import. The
    // window is the *actual* last delay, not `maxStaggerMs` — a small graph
    // finishes well inside the ceiling.
    this.cleanupTimer = setTimeout(() => {
      this.cleanupTimer = undefined;
      this.clear();
    }, durationMs + lastDelayMs + 120);
  }

  /**
   * Per-item delay, by rank along the chosen axis.
   *
   * The step is `staggerMs`, compressed so the whole sweep fits inside
   * `maxStaggerMs` — the difference between a 10-node graph (which should feel
   * like a sweep) and a 2,000-node one (which should not feel like a wait).
   */
  private buildDelays(ids: readonly string[]): (id: string) => number {
    const { order, staggerMs, maxStaggerMs } = this.opts;
    if (order === 'none' || staggerMs === 0 || ids.length < 2) return () => 0;

    const store = this.layer!.store;
    const axis = order === 'x' ? 'x' : 'y';
    const ranked = [...ids].sort((a, b) => {
      const pa = store.getPosition(a)?.[axis] ?? 0;
      const pb = store.getPosition(b)?.[axis] ?? 0;
      return pa - pb;
    });
    const step = Math.min(staggerMs, maxStaggerMs / (ranked.length - 1));
    const delays = new Map<string, number>();
    ranked.forEach((id, i) => delays.set(id, Math.round(i * step)));
    return (id: string) => delays.get(id) ?? 0;
  }

  /** Remove every effect this behaviour wrote, leaving any others in place. */
  private clear(): void {
    if (this.cleanupTimer !== undefined) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    const store = this.layer?.store;
    if (!store) {
      this.painted.nodes.length = 0;
      this.painted.edges.length = 0;
      return;
    }
    for (const id of this.painted.nodes.splice(0)) {
      const prev = (store.getNode(id)?.style ?? {}) as NodeStyle;
      if (!prev.effects) continue;
      store.updateNode(id, {
        style: { ...prev, effects: withoutEffect(prev.effects, NODE_EFFECT_KIND) } as NodeStyle,
      });
    }
    for (const id of this.painted.edges.splice(0)) {
      const prev = (store.getEdge(id)?.style ?? {}) as EdgeStyle;
      if (!prev.effects) continue;
      store.updateEdge(id, {
        style: { ...prev, effects: withoutEffect(prev.effects, EDGE_EFFECT_KIND) } as EdgeStyle,
      });
    }
  }
}
