/**
 * `ContentLODBehaviour` — abstract base for the zoom-visibility LOD family
 * (`NodeLabelLODBehaviour`, `EdgeLabelLODBehaviour`, `IconLODBehaviour`,
 * `ImageLODBehaviour`).
 *
 * Each concrete subclass gates **one** content kind by a single camera-zoom band
 * (`{ minZoom, maxZoom }`): when the camera leaves the band the content is hidden;
 * when it re-enters, shown. The engine renderer stays ignorant of zoom — it only
 * exposes generic per-element toggles (`setShapeTextVisible`,
 * `setConnectorTextVisible`, …); the subclass picks which, and which element set
 * ({@link ContentLODTarget}) it sweeps. This base owns the *policy*: react to
 * `input:camera:zoom` (RAF-coalesced), sweep only on a threshold **crossing**,
 * re-apply to new elements on `data:changed`, and restore on disable.
 *
 * Splitting per content kind (rather than one behaviour with several bands) lets
 * each be enabled and tuned independently — node labels and edge labels in
 * particular get separate panels.
 *
 * **One per layer and kind.** Each subclass is the only writer of its content
 * channel, so two instances of one kind on one layer would overwrite each
 * other's sweeps (and, for the label kinds, each other's size policy). A second
 * one throws at registration; put the band and the size options on one instance.
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** A zoom band. Content is shown when `minZoom ≤ camera.scale ≤ maxZoom`. */
export interface ZoomBand {
  /** Show at/above this camera scale. Omit (or `null`) for "no lower bound". */
  readonly minZoom?: number | null;
  /** Show at/below this camera scale. Omit (or `null`) for "no upper bound". */
  readonly maxZoom?: number | null;
}

/** Constructor options shared by every content-LOD behaviour. */
export interface ContentLODBehaviourOptions extends BehaviourOptions, ZoomBand {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;
}

/** Which element set a content-LOD sweep visits. */
export type ContentLODTarget = 'nodes' | 'edges';

/** The renderer subset the concrete subclasses toggle against. */
export type ContentRenderer = NonNullable<ReturnType<GraphLayer['getRenderer']>>;

/** Is `scale` inside the band? An unset bound is unbounded on that side. */
function inBand(scale: number, band: ZoomBand): boolean {
  return (
    (band.minZoom == null || scale >= band.minZoom) &&
    (band.maxZoom == null || scale <= band.maxZoom)
  );
}

/**
 * Which content-LOD instance holds each `(layer, kind)` — the one-per-layer rule
 * above. Keyed by layer object, so separate canvases never collide and a
 * destroyed layer drops its entries.
 */
const claims = new WeakMap<GraphLayer, Map<string, ContentLODBehaviour>>();

export abstract class ContentLODBehaviour<
  TOptions extends ContentLODBehaviourOptions = ContentLODBehaviourOptions,
> extends Behaviour<TOptions> {
  /** Registry kind — also the key of the one-per-layer claim. */
  abstract override readonly kind: string;

  /** Bound target layer — resolved in `onRegister`. */
  protected layer: GraphLayer | null = null;

  /**
   * The element set this behaviour's band sweeps. `'nodes'` unless a subclass
   * gates edge content (`EdgeLabelLODBehaviour`).
   */
  protected readonly contentTarget: ContentLODTarget = 'nodes';

  /** The active zoom band, live-read from `_options` so `setOptions` applies. */
  private get band(): ZoomBand {
    return { minZoom: this._options.minZoom, maxZoom: this._options.maxZoom };
  }

  /** Subscription disposers, called in `onDestroy`. */
  private readonly subs: Array<() => void> = [];

  /**
   * Last-applied visibility. `undefined` = not yet applied. The zoom path only
   * sweeps when the desired value differs, so a non-crossing zoom does no work.
   */
  private applied: boolean | undefined;

  /** RAF-coalescing handle. `null` when no apply is scheduled. */
  private rafHandle: number | null = null;
  /** A pending scheduled apply must re-sweep every node (new nodes / (re-)enable). */
  private pendingFull = false;

  constructor(opts: TOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  /**
   * Show / hide this behaviour's content kind on one element (a node or an
   * edge, per {@link contentTarget}). Subclasses route to the matching renderer
   * toggle (`setShapeTextVisible` / `setConnectorTextVisible` / `…Icon…` / …).
   */
  protected abstract setContentVisible(
    renderer: ContentRenderer,
    id: string,
    visible: boolean,
  ): void;

  /**
   * Override hook — elements whose content stays visible **even when the band
   * would hide it** (e.g. always-show the most central nodes' labels). Default:
   * no exemptions. Consulted only while the band is hiding, so it never
   * over-hides.
   */
  protected isExempt(_id: string): boolean {
    return false;
  }

  /**
   * Override hook — recompute the exemption set. Called before every **full**
   * sweep (data change / enable / `setOptions`), so an exemption derived from
   * topology (degree centrality) stays current, while zoom-only reflows skip it.
   */
  protected refreshExemptions(): void {}

  /**
   * Override hook — runs on every **full** reconcile (register / enable / data
   * change / option change), after {@link refreshExemptions}. For a subclass that
   * also pushes layer-wide config to the renderer (a label-size policy): the
   * renderer may not exist at register time, and a data change can mean a
   * remounted one, so re-pushing here keeps it current. Default no-op.
   */
  protected onFullReconcile(): void {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `${this.constructor.name} "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.claimLayer(layer);
    this.layer = layer;

    // Zoom drives the change-gated path; a data change re-applies the current
    // state to (potentially new) nodes. Both are RAF-coalesced.
    this.subs.push(
      ctx.events.on('input:camera:zoom', () => this.schedule(false)),
      layer.events.on('data:changed', () => this.schedule(true)),
    );

    if (this._enabled) this.schedule(true);
  }

  protected override onDestroy(): void {
    this.cancel();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.applied = undefined;
    if (this.layer) this.releaseLayer(this.layer);
    this.layer = null;
  }

  /**
   * Take this kind's slot on `layer`, or throw when another live instance of the
   * same kind already holds it. Runs before any subscription, so a rejected
   * instance leaves nothing wired.
   */
  private claimLayer(layer: GraphLayer): void {
    const key = this.kind;
    let held = claims.get(layer);
    if (!held) claims.set(layer, (held = new Map()));
    const holder = held.get(key);
    if (holder && holder !== this) {
      throw new Error(
        `${this.constructor.name} "${this.id}": layer "${layer.id}" already has ${key} "${holder.id}" — ` +
          `one per layer. Put the band and size options on "${holder.id}" instead.`,
      );
    }
    held.set(key, this);
  }

  /** Give the slot back — only if this instance is the one holding it. */
  private releaseLayer(layer: GraphLayer): void {
    const held = claims.get(layer);
    if (held?.get(this.kind) === this) held.delete(this.kind);
  }

  protected override onEnable(): void {
    this.applied = undefined;
    this.schedule(true);
  }

  protected override onDisable(): void {
    // Reversible: cancel any pending sweep and restore content to visible.
    this.cancel();
    this.sweep(true);
    this.applied = undefined;
  }

  // ─── Options ──────────────────────────────────────────────────────────────

  /**
   * A live option patch (band, exemption knobs) re-applies with a full sweep.
   * `enabled` is handled by the base `setOptions` before this runs.
   */
  protected override onOptionsChanged(): void {
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

  /**
   * Reconcile visibility to the current camera scale. When `full`, sweep every
   * node regardless of change (covers new nodes / re-enable); otherwise sweep
   * only when the band membership flipped (the zoom hot path).
   */
  private apply(full: boolean): void {
    const scale = this.ctx?.camera.scale;
    if (!this.layer || scale === undefined) return;
    if (full) {
      this.refreshExemptions();
      this.onFullReconcile();
    }
    const vis = inBand(scale, this.band);
    if (!full && this.applied === vis) return;
    this.applied = vis;
    this.sweep(vis);
  }

  /**
   * Set this behaviour's content visibility across every node (or edge, per
   * {@link contentTarget}) in the layer. When the band shows content, everything
   * is shown; when it hides, exempt elements ({@link isExempt}) stay visible.
   */
  private sweep(bandVisible: boolean): void {
    const renderer = this.layer?.getRenderer();
    if (!this.layer || !renderer) return;
    const elements = this.contentTarget === 'edges' ? this.layer.store.edges() : this.layer.store.nodes();
    for (const el of elements) {
      const visible = bandVisible || this.isExempt(el.id);
      this.setContentVisible(renderer, el.id, visible);
    }
  }
}
