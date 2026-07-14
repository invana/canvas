/**
 * `ContentLODBehaviour` — abstract base for the node-content zoom-visibility LOD
 * family (`TextLODBehaviour`, `IconLODBehaviour`, `ImageLODBehaviour`).
 *
 * Each concrete subclass gates **one** content kind by a single camera-zoom band
 * (`{ minZoom, maxZoom }`): when the camera leaves the band the content is hidden;
 * when it re-enters, shown. The engine renderer stays ignorant of zoom — it only
 * exposes generic `setShape{Text,Icon,Image}Visible` toggles; the subclass picks
 * which, and this base owns the *policy*: react to `input:camera:zoom` (RAF-
 * coalesced), sweep only on a threshold **crossing**, re-apply to new nodes on
 * `data:changed`, and restore on disable.
 *
 * Splitting per content kind (rather than one behaviour with three bands) lets
 * text / icon / image be enabled and tuned independently, and keeps text — which
 * also has a resolution LOD (`TextResolutionLODBehaviour`) and reaches inside
 * composite nodes — on its own surface.
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** A zoom band. Content is shown when `minZoom ≤ camera.scale ≤ maxZoom`. */
export interface ZoomBand {
  /** Show at/above this camera scale. Omit for "no lower bound". */
  readonly minZoom?: number;
  /** Show at/below this camera scale. Omit for "no upper bound". */
  readonly maxZoom?: number;
}

/** Constructor options shared by every content-LOD behaviour. */
export interface ContentLODBehaviourOptions extends BehaviourOptions, ZoomBand {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;
}

/** The renderer subset the concrete subclasses toggle against. */
export type ContentRenderer = NonNullable<ReturnType<GraphLayer['getRenderer']>>;

/** Is `scale` inside the band? An unset bound is unbounded on that side. */
function inBand(scale: number, band: ZoomBand): boolean {
  return (
    (band.minZoom === undefined || scale >= band.minZoom) &&
    (band.maxZoom === undefined || scale <= band.maxZoom)
  );
}

export abstract class ContentLODBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  protected layer: GraphLayer | null = null;

  /** The active zoom band. */
  private band: ZoomBand;

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

  constructor(opts: ContentLODBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.band = { minZoom: opts.minZoom, maxZoom: opts.maxZoom };
  }

  /**
   * Show / hide this behaviour's content kind on one node. Subclasses route to
   * the matching renderer toggle (`setShapeTextVisible` / `…Icon…` / `…Image…`).
   */
  protected abstract setContentVisible(
    renderer: ContentRenderer,
    id: string,
    visible: boolean,
  ): void;

  /**
   * Override hook — nodes whose content stays visible **even when the band would
   * hide it** (e.g. always-show the most central nodes' labels). Default: no
   * exemptions. Consulted only while the band is hiding, so it never over-hides.
   */
  protected isNodeExempt(_id: string): boolean {
    return false;
  }

  /**
   * Override hook — recompute the exemption set. Called before every **full**
   * sweep (data change / enable / `setOptions`), so an exemption derived from
   * topology (degree centrality) stays current, while zoom-only reflows skip it.
   */
  protected refreshExemptions(): void {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `${this.constructor.name} "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
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
    this.layer = null;
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

  // ─── Public API ───────────────────────────────────────────────────────────

  /** Read-only snapshot of the active zoom band. */
  get band$(): Readonly<ZoomBand> {
    return this.band;
  }

  /** Runtime option update — re-applies immediately (a full sweep) if enabled. */
  setOptions(patch: Partial<ContentLODBehaviourOptions>): void {
    this.band = {
      minZoom: 'minZoom' in patch ? patch.minZoom : this.band.minZoom,
      maxZoom: 'maxZoom' in patch ? patch.maxZoom : this.band.maxZoom,
    };
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
    if (full) this.refreshExemptions();
    const vis = inBand(scale, this.band);
    if (!full && this.applied === vis) return;
    this.applied = vis;
    this.sweep(vis);
  }

  /**
   * Set this behaviour's content visibility across every node in the layer. When
   * the band shows content, everything is shown; when it hides, exempt nodes
   * ({@link isNodeExempt}) stay visible.
   */
  private sweep(bandVisible: boolean): void {
    const renderer = this.layer?.getRenderer();
    if (!this.layer || !renderer) return;
    for (const node of this.layer.store.nodes()) {
      const visible = bandVisible || this.isNodeExempt(node.id);
      this.setContentVisible(renderer, node.id, visible);
    }
  }
}
