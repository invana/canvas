/**
 * `EdgeLODBehaviour` — **thin edges when zoomed out.** Below a camera-zoom
 * threshold the edges of a dense graph merge into a sub-pixel blob, yet the
 * renderer still draws every one of them (the per-frame `layers` cost on a
 * hairball). This behaviour hides all but a `keepFraction` of them below the
 * threshold and restores them above it — so the zoomed-out view costs a fraction
 * to draw while the zoomed-in view is untouched.
 *
 * It reuses the store's explicit **edge-hidden** flag (`hideEdges` / `showEdges`),
 * so thinned edges drop out of *both* the render pass and the hit index — and it
 * therefore composes with the viewport culler (hidden edges leave the index, so
 * the culler ignores them; no fight over `renderable`). It only ever un-hides
 * edges *it* hid, so a user's manual edge-hides are preserved.
 *
 * Phase 2 (C) of `docs/large-graph-performance-plan.md` — the lever for the
 * fully **zoomed-out** hairball, where viewport culling buys nothing. Opt-in,
 * off the per-frame path (reacts to `input:camera:zoom`, RAF-coalesced).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EdgeLODBehaviour({
 *     id: 'edge-lod', targetLayerId: 'graph', enabled: true,
 *     minZoom: 0.5,        // below 0.5× zoom, thin…
 *     keepFraction: 0.1,   // …keep the top 10% of edges
 *     keepBy: 'degree',    // …chosen as the high-degree backbone
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { GraphEdge } from '../store/types';

/** How the kept (never-thinned) edges are chosen. */
export type EdgeLODKeepBy = 'sample' | 'weight' | 'degree';

/** Constructor options for {@link EdgeLODBehaviour}. */
export interface EdgeLODBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;
  /** Thin edges when `camera.scale` is below this. Default `0.5`. */
  minZoom?: number;
  /** Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`. */
  keepFraction?: number;
  /**
   * Which edges to keep: `'sample'` (a stable pseudo-random subset — preserves
   * the overall density texture; default), `'weight'` (highest {@link weightKey}),
   * or `'degree'` (between the highest-degree endpoints — the structural backbone).
   */
  keepBy?: EdgeLODKeepBy;
  /** Numeric edge-`data` field used when `keepBy: 'weight'`. */
  weightKey?: string;
}

interface ResolvedOptions {
  minZoom: number;
  keepFraction: number;
  keepBy: EdgeLODKeepBy;
  weightKey: string | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<EdgeLODBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    minZoom: 0.5,
    keepFraction: 0.1,
    keepBy: 'sample',
    weightKey: undefined,
  };
  return {
    minZoom: patch.minZoom ?? base.minZoom,
    keepFraction: clampFraction(patch.keepFraction ?? base.keepFraction),
    keepBy: patch.keepBy ?? base.keepBy,
    weightKey: 'weightKey' in patch ? patch.weightKey : base.weightKey,
  };
}

/** Clamp a fraction into `(0, 1]`; invalid → `1` (keep everything = no thinning). */
function clampFraction(v: number): number {
  return typeof v === 'number' && v > 0 ? Math.min(1, v) : 1;
}

/** Stable FNV-1a hash of an id → `[0, 1)`, for the `'sample'` keep policy. */
function hashUnit(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0x100000000;
}

export class EdgeLODBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private readonly subs: Array<() => void> = [];

  /** Edges eligible to be hidden when thinned (everything outside the kept set). */
  private readonly thinnable = new Set<string>();
  /** Edges *we* hid (weren't already user-hidden) — so restore only touches ours. */
  private readonly hiddenByUs = new Set<string>();

  /** Last-applied thinned state. `undefined` = not yet applied. */
  private applied: boolean | undefined;

  /** RAF-coalescing handle. */
  private rafHandle: number | null = null;
  /** A pending scheduled apply must recompute the thinnable set (data / (re-)enable). */
  private pendingFull = false;

  constructor(opts: EdgeLODBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `EdgeLODBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this.subs.push(
      ctx.events.on('input:camera:zoom', () => this.schedule(false)),
      layer.events.on('data:changed', () => this.schedule(true)),
    );
    if (this._enabled) this.schedule(true);
  }

  protected override onDestroy(): void {
    this.cancel();
    this.show();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.thinnable.clear();
    this.applied = undefined;
    this.layer = null;
  }

  protected override onEnable(): void {
    this.applied = undefined;
    this.schedule(true);
  }

  protected override onDisable(): void {
    this.cancel();
    this.show();
    this.applied = undefined;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /** Read-only snapshot of resolved options. */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /** Runtime option update — re-applies immediately (a full pass) if enabled. */
  setOptions(patch: Partial<EdgeLODBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
    this.applied = undefined;
    if (this._enabled) this.schedule(true);
  }

  // ─── Scheduling ───────────────────────────────────────────────────────────

  private schedule(full: boolean): void {
    if (!this._enabled) return;
    if (full) this.pendingFull = true;
    if (this.rafHandle !== null) return;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
    const run = (): void => {
      this.rafHandle = null;
      const full2 = this.pendingFull;
      this.pendingFull = false;
      this.apply(full2);
    };
    this.rafHandle = raf ? raf(run) : (setTimeout(run, 0) as unknown as number);
  }

  private cancel(): void {
    if (this.rafHandle === null) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.rafHandle);
    else clearTimeout(this.rafHandle);
    this.rafHandle = null;
    this.pendingFull = false;
  }

  // ─── Apply ────────────────────────────────────────────────────────────────

  private apply(full: boolean): void {
    const scale = this.ctx?.camera.scale;
    if (!this.layer || scale === undefined) return;
    const thinned = scale < this.opts.minZoom;
    if (full) {
      // Restore our prior hides, recompute the kept/thinnable split against the
      // current graph, then re-hide if we're below the threshold.
      this.show();
      this.computeThinnable();
      this.applied = thinned;
      if (thinned) this.hide();
      return;
    }
    if (this.applied === thinned) return;
    this.applied = thinned;
    if (thinned) this.hide();
    else this.show();
  }

  /** Recompute the thinnable set — every edge outside the top `keepFraction`. */
  private computeThinnable(): void {
    this.thinnable.clear();
    const layer = this.layer;
    if (!layer) return;
    const store = layer.store;
    const { keepFraction, keepBy } = this.opts;
    if (keepFraction >= 1) return; // keep all → nothing to thin

    if (keepBy === 'sample') {
      // Uniform hash → a stable ~keepFraction subset survives; the rest thin.
      for (const e of store.edges()) {
        if (hashUnit(e.id) >= keepFraction) this.thinnable.add(e.id);
      }
      return;
    }

    // 'weight' / 'degree' — rank, keep the top fraction, thin the rest.
    const ranked: Array<{ id: string; score: number }> = [];
    for (const e of store.edges()) {
      const score =
        keepBy === 'weight'
          ? this.weightOf(e)
          : store.inDegree(e.source) +
            store.outDegree(e.source) +
            store.inDegree(e.target) +
            store.outDegree(e.target);
      ranked.push({ id: e.id, score });
    }
    ranked.sort((a, b) => b.score - a.score);
    const keepCount = Math.ceil(ranked.length * keepFraction);
    for (let i = keepCount; i < ranked.length; i++) this.thinnable.add(ranked[i]!.id);
  }

  private weightOf(edge: GraphEdge): number {
    const key = this.opts.weightKey;
    if (key === undefined) return 0;
    const v = (edge.data as Record<string, unknown> | undefined)?.[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  }

  /** Hide the thinnable edges we don't already find hidden (recording which). */
  private hide(): void {
    const store = this.layer?.store;
    if (!store) return;
    const toHide: string[] = [];
    for (const id of this.thinnable) {
      if (!store.isEdgeHidden(id)) toHide.push(id);
    }
    if (toHide.length === 0) return;
    store.hideEdges(toHide);
    for (const id of toHide) this.hiddenByUs.add(id);
  }

  /** Un-hide only the edges we hid (leaving any user-hidden edges alone). */
  private show(): void {
    const store = this.layer?.store;
    if (!store || this.hiddenByUs.size === 0) return;
    store.showEdges(this.hiddenByUs);
    this.hiddenByUs.clear();
  }
}
