/**
 * `FisheyeBehaviour` — a focus+context magnifier lens over a `GraphLayer`.
 *
 * Nodes within `radius` screen pixels of the lens centre are drawn pushed apart
 * (Sarkar–Brown distortion, see {@link fisheyeDisplace}) and enlarged toward the
 * centre, with their labels forced visible — so a dense region can be read in
 * place while everything outside the lens, and the region's relation to it,
 * stays where it is. Modelled on G6's Fisheye plugin.
 *
 * **Display-only.** The lens never writes the store: it drives the renderer's
 * `setShapeDisplayOverride`, which layers the displacement on top of each node's
 * logical position and LOD scale. Layouts, history, export and collaboration
 * never see it, a running force layout keeps ticking underneath it, and
 * connectors + picking follow the *drawn* node (edges stay glued, clicks land on
 * what you see). A raster export taken while the lens is up does capture it.
 *
 * **Input.**
 * - `trigger: 'pointermove'` (default) — the lens follows the cursor and hides
 *   when the cursor leaves the canvas.
 * - `trigger: 'click'` — a click places the lens; it stays until the next click.
 * - `trigger: 'drag'` — a click places it; dragging from inside the lens moves it
 *   (claims the gesture, so drag-pan yields).
 * - `radiusWheelModifier` (default `alt`) / `distortionWheelModifier` (default
 *   `shift`) + wheel, with the cursor inside the lens, grow/shrink the radius /
 *   distortion (scroll up = bigger / stronger). The wheel event is caught in the
 *   capture phase so the camera does not zoom as well; a plain wheel still does.
 *   On macOS a trackpad pinch arrives as `ctrl`+wheel, so `'ctrl'` as a modifier
 *   would hijack pinch-zoom inside the lens.
 *
 * While another behaviour owns the pointer gesture (node drag, lasso, brush) the
 * lens steps aside — overrides cleared, ring hidden — and returns on release, so
 * a magnified node can never feed its drawn offset into drag maths.
 *
 * Expanded group frames are skipped (their geometry is derived from members);
 * collapsed groups distort like ordinary nodes.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new FisheyeBehaviour({ id: 'fisheye', targetLayerId: 'graph', enabled: true, radius: 140 }),
 * );
 * ```
 */

import {
  Behaviour,
  type BehaviourOptions,
  type CanvasContext,
  type IElementRenderer,
  type IOverlayDevice,
  type ShapeDisplayOverride,
} from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import { fisheyeDisplace } from './fisheye';

/** How the lens is moved. */
export type FisheyeTrigger = 'pointermove' | 'click' | 'drag';

/** A keyboard modifier that turns the wheel into a lens adjustment. */
export type FisheyeWheelModifier = 'alt' | 'shift' | 'ctrl' | 'meta';

/** Constructor options for {@link FisheyeBehaviour}. Flat and JSON-serialisable. */
export interface FisheyeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id whose nodes the lens distorts. */
  targetLayerId: string;
  /** How the lens moves. Default `'pointermove'`. */
  trigger?: FisheyeTrigger;
  /** Lens radius in **screen pixels** (same apparent size at any zoom). Default `120`. */
  radius?: number;
  /** Lower clamp for {@link radius}. Default `20`. */
  minRadius?: number;
  /** Upper clamp for {@link radius}; `null` = half the canvas's shorter side. Default `null`. */
  maxRadius?: number | null;
  /** Distortion factor `d` — `0` = none, larger spreads the focus more. Default `1.5`. */
  distortion?: number;
  /** Lower clamp for {@link distortion}. Default `0`. */
  minDistortion?: number;
  /** Upper clamp for {@link distortion}. Default `5`. */
  maxDistortion?: number;
  /** Node size multiplier at the lens centre, easing to `1` at the rim. `1` = no enlargement. Default `1.5`. */
  nodeScale?: number;
  /** Force labels visible for nodes inside the lens (beats text LOD and label collision). Default `true`. */
  showLabels?: boolean;
  /** Modifier that makes the wheel adjust the radius; `null` disables. Default `'alt'`. */
  radiusWheelModifier?: FisheyeWheelModifier | null;
  /** Modifier that makes the wheel adjust the distortion; `null` disables. Default `'shift'`. */
  distortionWheelModifier?: FisheyeWheelModifier | null;
  /** Lens ring colour. Default `0x64748b`. */
  lensStrokeColor?: number;
  /** Lens ring width in screen pixels. Default `2`. */
  lensStrokeWidth?: number;
  /** Lens disc fill colour. Default `0x94a3b8`. */
  lensFillColor?: number;
  /** Lens disc fill alpha (`0` = no fill). Default `0.08`. */
  lensFillAlpha?: number;
}

/** {@link FisheyeBehaviourOptions} with every default applied. */
export interface ResolvedFisheyeOptions {
  trigger: FisheyeTrigger;
  radius: number;
  minRadius: number;
  maxRadius: number | null;
  distortion: number;
  minDistortion: number;
  maxDistortion: number;
  nodeScale: number;
  showLabels: boolean;
  radiusWheelModifier: FisheyeWheelModifier | null;
  distortionWheelModifier: FisheyeWheelModifier | null;
  lensStrokeColor: number;
  lensStrokeWidth: number;
  lensFillColor: number;
  lensFillAlpha: number;
}

const DEFAULTS: ResolvedFisheyeOptions = {
  trigger: 'pointermove',
  radius: 120,
  minRadius: 20,
  maxRadius: null,
  distortion: 1.5,
  minDistortion: 0,
  maxDistortion: 5,
  nodeScale: 1.5,
  showLabels: true,
  radiusWheelModifier: 'alt',
  distortionWheelModifier: 'shift',
  lensStrokeColor: 0x64748b,
  lensStrokeWidth: 2,
  lensFillColor: 0x94a3b8,
  lensFillAlpha: 0.08,
};

/** Clamp `v` into `[min, max]`. */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Merge `patch` over `prev` (or the defaults), keeping radius / distortion inside their bounds. */
function resolveOptions(
  prev: ResolvedFisheyeOptions | null,
  patch: Partial<FisheyeBehaviourOptions>,
): ResolvedFisheyeOptions {
  const base = prev ?? DEFAULTS;
  const pick = <K extends keyof ResolvedFisheyeOptions>(k: K): ResolvedFisheyeOptions[K] =>
    k in patch && patch[k] !== undefined ? (patch[k] as ResolvedFisheyeOptions[K]) : base[k];
  const r: ResolvedFisheyeOptions = {
    trigger: pick('trigger'),
    radius: pick('radius'),
    minRadius: pick('minRadius'),
    maxRadius: pick('maxRadius'),
    distortion: pick('distortion'),
    minDistortion: pick('minDistortion'),
    maxDistortion: pick('maxDistortion'),
    nodeScale: pick('nodeScale'),
    showLabels: pick('showLabels'),
    radiusWheelModifier: pick('radiusWheelModifier'),
    distortionWheelModifier: pick('distortionWheelModifier'),
    lensStrokeColor: pick('lensStrokeColor'),
    lensStrokeWidth: pick('lensStrokeWidth'),
    lensFillColor: pick('lensFillColor'),
    lensFillAlpha: pick('lensFillAlpha'),
  };
  r.radius = clamp(r.radius, r.minRadius, r.maxRadius ?? Number.POSITIVE_INFINITY);
  r.distortion = clamp(r.distortion, r.minDistortion, r.maxDistortion);
  return r;
}

/** Is `mod` held on `e`? */
function modifierHeld(e: WheelEvent, mod: FisheyeWheelModifier | null): boolean {
  switch (mod) {
    case 'alt': return e.altKey;
    case 'shift': return e.shiftKey;
    case 'ctrl': return e.ctrlKey;
    case 'meta': return e.metaKey;
    default: return false;
  }
}

/** Radius step per wheel notch (multiplicative) and distortion step (additive) — G6's values. */
const RADIUS_STEP = 0.05;
const DISTORTION_STEP = 0.1;
/** Pointer travel (px) under which a press-release counts as a click, not a drag. */
const CLICK_SLOP_PX = 4;

export class FisheyeBehaviour extends Behaviour<FisheyeBehaviourOptions> {
  override readonly kind = 'fisheye';

  private opts: ResolvedFisheyeOptions;
  private layer: GraphLayer | null = null;
  private overlay: IOverlayDevice | null = null;

  /** Lens centre in canvas-relative screen px, or `null` when there is no lens. */
  private focus: { x: number; y: number } | null = null;
  /** Overrides currently applied, by node id — diffed against each new frame. */
  private applied = new Map<string, ShapeDisplayOverride>();
  /** Reused buffer for {@link GraphStore.nodeIdsWithin}. */
  private readonly candidates: string[] = [];
  /** Per-node group role, cached between data changes (style resolution isn't free). */
  private readonly skipCache = new Map<string, boolean>();

  /** Press position for click detection, or `null` when no press is in flight. */
  private press: { x: number; y: number } | null = null;
  /** `true` while this behaviour is dragging the lens (`trigger: 'drag'`). */
  private draggingLens = false;

  private rafId: number | null = null;
  private readonly disposers: Array<() => void> = [];

  constructor(opts: FisheyeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? FisheyeBehaviour.shortcutsFor(resolveOptions(null, opts)) });
    this.opts = resolveOptions(null, opts);
  }

  /** Advisory gesture ids for the registry's conflict warnings. */
  private static shortcutsFor(o: ResolvedFisheyeOptions): string[] {
    const out: string[] = [o.trigger];
    if (o.radiusWheelModifier) out.push(`${o.radiusWheelModifier}+wheel`);
    if (o.distortionWheelModifier) out.push(`${o.distortionWheelModifier}+wheel`);
    return out;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `FisheyeBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // Screen-space ring: one transform write per pointer frame.
    this.overlay = ctx.createOverlay(`${this.id}-lens`, 'screen');
    this.overlay.setVisible(false);
    this.drawRing();

    const schedule = (): void => this.schedule();
    this.disposers.push(
      // Positions moved (layout tick, data edit) — re-distort from the new ones.
      layer.events.on('data:changed', () => {
        this.skipCache.clear();
        schedule();
      }),
      // The lens is screen-anchored, so any camera move changes what's under it.
      ctx.events.on('input:camera:pan', schedule),
      ctx.events.on('input:camera:zoom', schedule),
      ctx.store.view.subscribe((s, prev) => {
        if (s.interaction.camera !== prev.interaction.camera) schedule();
      }),
      // Step aside while another behaviour owns the gesture (D12).
      ctx.gestures.onOwnerChange(schedule),
    );

    const el = ctx.canvasElement;
    if (!el) return;
    const onMove = (e: PointerEvent): void => this.handlePointerMove(e);
    const onLeave = (): void => this.handlePointerLeave();
    const onDown = (e: PointerEvent): void => this.handlePointerDown(e);
    const onUp = (e: PointerEvent): void => this.handlePointerUp(e);
    const onWheel = (e: WheelEvent): void => this.handleWheel(e);
    // Capture on the host so the wheel is ours before pixi-viewport's zoom
    // listener on the canvas sees it (D15).
    const wheelTarget: HTMLElement = el.parentElement ?? el;
    // One window-level move listener serves both the hover lens (filtered to
    // the canvas) and lens drags (which may leave it).
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    wheelTarget.addEventListener('wheel', onWheel, { capture: true, passive: false });
    this.disposers.push(
      () => el.removeEventListener('pointerleave', onLeave),
      () => el.removeEventListener('pointerdown', onDown),
      () => window.removeEventListener('pointermove', onMove),
      () => window.removeEventListener('pointerup', onUp),
      () => window.removeEventListener('pointercancel', onUp),
      () => wheelTarget.removeEventListener('wheel', onWheel, { capture: true }),
    );
  }

  protected override onEnable(): void {
    this.schedule();
  }

  protected override onDisable(): void {
    this.focus = null;
    this.press = null;
    this.draggingLens = false;
    this.cancelFrame();
    this.clearLens();
  }

  protected override onDestroy(): void {
    this.cancelFrame();
    this.clearLens();
    for (const off of this.disposers) off();
    this.disposers.length = 0;
    this.overlay?.destroy();
    this.overlay = null;
    this.layer = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Read-only snapshot of the resolved options. */
  get options(): Readonly<ResolvedFisheyeOptions> {
    return this.opts;
  }

  /**
   * Place the lens at a canvas-relative screen point (`null` removes it) — the
   * programmatic twin of a click, for hosts that drive the lens themselves.
   */
  setFocus(point: { x: number; y: number } | null): void {
    this.focus = point === null ? null : { x: point.x, y: point.y };
    this.schedule();
  }

  /** Include the serialisable lens options in a canvas-state snapshot. */
  override serializeDefinition(): Record<string, unknown> {
    const o = this.opts;
    return {
      ...super.serializeDefinition(),
      trigger: o.trigger,
      radius: o.radius,
      minRadius: o.minRadius,
      maxRadius: o.maxRadius,
      distortion: o.distortion,
      minDistortion: o.minDistortion,
      maxDistortion: o.maxDistortion,
      nodeScale: o.nodeScale,
      showLabels: o.showLabels,
      radiusWheelModifier: o.radiusWheelModifier,
      distortionWheelModifier: o.distortionWheelModifier,
      lensStrokeColor: o.lensStrokeColor,
      lensStrokeWidth: o.lensStrokeWidth,
      lensFillColor: o.lensFillColor,
      lensFillAlpha: o.lensFillAlpha,
    };
  }

  /** Live option update (settings editor, `canvas.update`). */
  protected override onOptionsChanged(changes: Partial<FisheyeBehaviourOptions>): void {
    const prevTrigger = this.opts.trigger;
    this.opts = resolveOptions(this.opts, changes);
    // A lens left behind by a click/drag trigger has no cursor to follow.
    if (this.opts.trigger !== prevTrigger) this.focus = null;
    this.drawRing();
    this.schedule();
  }

  // ─── Input ──────────────────────────────────────────────────────────────

  /** Canvas-relative screen coordinates of a DOM event. */
  private screenFromEvent(e: MouseEvent): { x: number; y: number } {
    const el = this.ctx?.canvasElement;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private insideLens(p: { x: number; y: number }): boolean {
    const f = this.focus;
    return f !== null && Math.hypot(p.x - f.x, p.y - f.y) <= this.opts.radius;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isEnabled) return;
    const onCanvas = e.target === this.ctx?.canvasElement;
    if (this.opts.trigger === 'pointermove') {
      // Hover tracking is canvas-only; the cursor over other DOM is "away".
      if (!onCanvas) return;
      this.focus = this.screenFromEvent(e);
      this.schedule();
    } else if (this.draggingLens) {
      this.focus = this.screenFromEvent(e);
      this.schedule();
    }
  }

  private handlePointerLeave(): void {
    if (!this.isEnabled || this.opts.trigger !== 'pointermove') return;
    this.focus = null;
    this.schedule();
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isEnabled || e.button !== 0) return;
    const p = this.screenFromEvent(e);
    this.press = p;
    if (this.opts.trigger === 'drag' && this.insideLens(p) && this.claimGesture()) {
      this.draggingLens = true;
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    const press = this.press;
    this.press = null;
    if (this.draggingLens) {
      this.draggingLens = false;
      this.releaseGesture();
      return;
    }
    if (!this.isEnabled || press === null || e.type === 'pointercancel') return;
    const p = this.screenFromEvent(e);
    if (Math.hypot(p.x - press.x, p.y - press.y) > CLICK_SLOP_PX) return;
    // `click` moves the lens on every click; `drag` places it only when absent.
    if (this.opts.trigger === 'click' || (this.opts.trigger === 'drag' && this.focus === null)) {
      this.focus = p;
      this.schedule();
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.isEnabled || this.focus === null) return;
    const { radiusWheelModifier, distortionWheelModifier } = this.opts;
    const adjustR = modifierHeld(e, radiusWheelModifier);
    const adjustD = !adjustR && modifierHeld(e, distortionWheelModifier);
    if (!adjustR && !adjustD) return;
    if (!this.insideLens(this.screenFromEvent(e))) return;
    // Ours — the camera must not zoom on the same notch.
    e.preventDefault();
    e.stopPropagation();
    // Shift+wheel on macOS reports the scroll on `deltaX`.
    const delta = e.deltaY + e.deltaX;
    if (delta === 0) return;
    const grow = delta < 0;
    const o = this.opts;
    if (adjustR) {
      const ceiling = o.maxRadius ?? this.halfShortSide();
      const next = o.radius * (grow ? 1 / (1 - RADIUS_STEP) : 1 - RADIUS_STEP);
      this.adjust({ radius: clamp(next, o.minRadius, Math.max(o.minRadius, ceiling)) });
    } else {
      const next = o.distortion + (grow ? DISTORTION_STEP : -DISTORTION_STEP);
      this.adjust({ distortion: clamp(next, o.minDistortion, o.maxDistortion) });
    }
  }

  /** Apply a wheel adjustment and record it so `getOptions()` (the editor's seed) stays current. */
  private adjust(patch: Pick<Partial<FisheyeBehaviourOptions>, 'radius' | 'distortion'>): void {
    this.recordOptions(patch);
    this.opts = resolveOptions(this.opts, patch);
    if ('radius' in patch) this.drawRing();
    this.schedule();
  }

  private halfShortSide(): number {
    const el = this.ctx?.canvasElement;
    return el ? Math.min(el.clientWidth, el.clientHeight) / 2 : Number.POSITIVE_INFINITY;
  }

  // ─── Frame ──────────────────────────────────────────────────────────────

  private schedule(): void {
    if (this.rafId !== null) return;
    if (typeof requestAnimationFrame === 'undefined') {
      this.update();
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.update();
    });
  }

  private cancelFrame(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  /** Recompute the lens population and push the diff to the renderer. */
  private update(): void {
    const ctx = this.ctx;
    const layer = this.layer;
    const renderer = layer?.getRenderer();
    const owner = ctx?.gestures.owner ?? null;
    const focus = this.focus;
    if (!ctx || !layer || !renderer || !this.isEnabled || focus === null || (owner !== null && owner !== this.id)) {
      this.clearLens();
      return;
    }

    const o = this.opts;
    const zoom = Math.max(ctx.camera.scale, 1e-6);
    const centre = ctx.camera.toWorld(focus.x, focus.y);
    const rWorld = o.radius / zoom;
    const store = layer.store;
    const ids = store.nodeIdsWithin(centre.x, centre.y, rWorld, this.candidates);

    const next = new Map<string, ShapeDisplayOverride>();
    for (const id of ids) {
      if (this.isSkipped(id)) continue;
      const pos = store.getPosition(id);
      if (!pos) continue;
      const disp = fisheyeDisplace(pos.x, pos.y, centre.x, centre.y, rWorld, o.distortion, o.nodeScale);
      if (!disp) continue;
      next.set(id, { dx: disp.dx, dy: disp.dy, scale: disp.scale, showText: o.showLabels });
    }

    const touched = new Set<string>();
    for (const [id, override] of next) {
      renderer.setShapeDisplayOverride(id, override);
      touched.add(id);
    }
    for (const id of this.applied.keys()) {
      if (next.has(id)) continue;
      renderer.setShapeDisplayOverride(id, null);
      touched.add(id);
    }
    this.applied = next;
    this.rerouteIncident(renderer, touched);

    this.overlay?.setPosition(focus.x, focus.y).setVisible(true);
  }

  /** Remove every override this lens applied, re-route their edges, hide the ring. */
  private clearLens(): void {
    this.overlay?.setVisible(false);
    if (this.applied.size === 0) return;
    const renderer = this.layer?.getRenderer();
    const touched = new Set(this.applied.keys());
    this.applied = new Map();
    if (!renderer) return;
    for (const id of touched) renderer.setShapeDisplayOverride(id, null);
    this.rerouteIncident(renderer, touched);
  }

  /** Re-route each connector incident to a touched node once, so edges follow the drawn nodes. */
  private rerouteIncident(renderer: IElementRenderer, nodeIds: ReadonlySet<string>): void {
    const store = this.layer?.store;
    if (!store || nodeIds.size === 0) return;
    const done = new Set<string>();
    for (const id of nodeIds) {
      for (const edge of store.edgesOf(id)) {
        if (done.has(edge.id)) continue;
        done.add(edge.id);
        if (renderer.hasConnector(edge.id)) renderer.updateConnector(edge.id, {});
      }
    }
  }

  /** Expanded group frames don't distort — their frame is derived from their members. */
  private isSkipped(id: string): boolean {
    let skip = this.skipCache.get(id);
    if (skip === undefined) {
      skip = this.layer?.getGroupRole(id) === 'expanded';
      this.skipCache.set(id, skip);
    }
    return skip;
  }

  private drawRing(): void {
    const ov = this.overlay;
    if (!ov) return;
    const o = this.opts;
    ov.clear().ellipse(0, 0, o.radius, o.radius);
    if (o.lensFillAlpha > 0) ov.fill({ color: o.lensFillColor, alpha: o.lensFillAlpha });
    if (o.lensStrokeWidth > 0) ov.stroke({ color: o.lensStrokeColor, width: o.lensStrokeWidth });
  }
}
