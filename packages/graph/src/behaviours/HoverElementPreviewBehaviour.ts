/**
 * `HoverElementPreviewBehaviour` — surfaces a **hover preview card** for nodes and
 * edges. Headless: it detects a dwelled hover, resolves the hovered element +
 * its anchor position, builds a flat {@link ResolvedPreviewCard} from a
 * serializable {@link HoverElementPreviewCardSpec}, and emits `preview:show` /
 * `preview:move` / `preview:hide`. It renders **no UI** — a consumer (a React
 * `HoverElementPreviewCard`, or plain DOM in a story) draws the card from the
 * emitted snapshot and positions it at `target.screen`.
 *
 * This mirrors the headless pattern of {@link ContextMenuBehaviour} (resolve a
 * target + screen coords, emit, let the consumer draw) and the dedicated event
 * bus of {@link ClickViewBehaviour}. It is deliberately **separate** from
 * {@link HoverActivateBehaviour}: that one drives visual *state*
 * (highlight / dim / raise) on pointerover; this one drives a *card* with its
 * own dwell (`openDelay`) and grace (`closeDelay`) timing. The two compose —
 * one can highlight the node while the other shows its card.
 *
 * **Serializable by design.** Every option except the event callbacks is plain
 * JSON — `targets`, `openDelay`, `closeDelay`, `placement`, and the whole
 * `card` field-map. That lets the card be authored in display-settings and
 * round-tripped. The field-path resolution (`data.name`, `type`, …) runs once
 * per shown hover against the single hovered element, so it is O(1) in graph
 * size — unaffected by 100k-node / 500k-edge graphs.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * const preview = new HoverElementPreviewBehaviour({
 *   id: 'preview',
 *   targetLayerId: 'graph',
 *   enabled: true,
 *   card: {
 *     image: { field: 'data.avatar', shape: 'rounded' },
 *     title: { field: 'data.name' },
 *     subtitle: { field: 'data.description', maxLines: 2 },
 *     rows: [
 *       { label: 'Email', field: 'data.email' },
 *       { label: 'Score', field: 'data.score', format: 'percent' },
 *     ],
 *   },
 * });
 * canvas.behaviours.register(preview);
 * preview.events.on('preview:show', ({ card, target }) => drawCard(card, target.screen));
 * preview.events.on('preview:hide', () => hideCard());
 * ```
 */

import {
  Behaviour,
  EventEmitter,
  type BehaviourOptions,
  type CanvasContext,
} from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Which kind of element a preview targets. */
export type PreviewTargetKind = 'node' | 'edge';

/**
 * Where the card anchors relative to the element — a hint passed through to the
 * consumer in {@link PreviewSnapshot.placement}.
 *
 * `'auto'` defers the side choice to the consumer: only the consumer renders
 * the card, so only it knows the card's size and the viewport bounds needed to
 * flip the card inward near a screen corner/edge and clamp it on-screen. The
 * headless behaviour never measures the card, so it can't resolve `'auto'`
 * itself — it emits the anchor (`target.screen`) and the hint, and the
 * consumer's positioner does the collision-aware flip + clamp.
 */
export type PreviewPlacement =
  | 'auto'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

// ─── Serializable card spec ─────────────────────────────────────────────────

/**
 * A dotted field path into the hovered element record — e.g. `'data.name'`,
 * `'type'`, `'id'`, or (for edges) `'source'` / `'target'`. Resolved against
 * the store's node / edge object.
 */
export type PreviewFieldPath = string;

/** Image field for the left identity-card avatar. */
export interface PreviewImageSpec {
  /** Field path resolving to an image URL string. */
  field: PreviewFieldPath;
  /** Avatar shape. Default `'rounded'`. */
  shape?: 'rounded' | 'circle';
}

/** A single text field (title). */
export interface PreviewTextSpec {
  field: PreviewFieldPath;
}

/** The description line — clamped to `maxLines`. */
export interface PreviewSubtitleSpec {
  field: PreviewFieldPath;
  /** Line clamp. Default `2`. */
  maxLines?: number;
}

/** Numeric/text formatting for a property row value. */
export type PreviewRowFormat = 'text' | 'percent';

/** A labelled property row beneath the identity block. */
export interface PreviewRowSpec {
  label: string;
  field: PreviewFieldPath;
  /** Value formatting. Default `'text'`. */
  format?: PreviewRowFormat;
}

/**
 * The serializable preview-card template. Pure JSON — author it in display
 * settings and feed it verbatim. `id` + `type` are rendered automatically
 * (structural, from the resolved target) and need no field entry here.
 */
export interface HoverElementPreviewCardSpec {
  /** Left avatar; the whole block is skipped when the field doesn't resolve. */
  image?: PreviewImageSpec;
  /** Title line (e.g. a display name). */
  title?: PreviewTextSpec;
  /** Description line, 2-line clamp by default. */
  subtitle?: PreviewSubtitleSpec;
  /** Labelled property rows, full-width below a divider. Empty values are dropped. */
  rows?: readonly PreviewRowSpec[];
}

// ─── Resolved (flat, render-ready) card ─────────────────────────────────────

/** A resolved property row — primitive label + value, ready to render. */
export interface PreviewCardRow {
  label: string;
  value: string;
}

/**
 * The render-ready card — all field paths resolved against the hovered element
 * to concrete primitives. The consumer renders this directly; no field logic
 * leaks into the UI.
 */
export interface ResolvedPreviewCard {
  /** Element id (rendered in the header strip). */
  id: string;
  kind: PreviewTargetKind;
  /** Element `type` tag, if any (rendered in the header strip beside the id). */
  type?: string;
  /** Resolved image URL, or `undefined` to skip the avatar column. */
  imageUrl?: string;
  /** Avatar shape — always concrete (defaults applied). */
  imageShape: 'rounded' | 'circle';
  /** Resolved title text, if the field resolved. */
  title?: string;
  /** Resolved description text, if the field resolved. */
  subtitle?: string;
  /** Line clamp for the subtitle — always concrete. */
  subtitleMaxLines: number;
  /** Resolved property rows (empty values already dropped). */
  rows: PreviewCardRow[];
}

// ─── Emitted payloads ───────────────────────────────────────────────────────

/** The element a preview is anchored to, plus its world + screen position. */
export interface PreviewTarget {
  id: string;
  kind: PreviewTargetKind;
  type?: string;
  /** Arbitrary user payload from `node.data` / `edge.data`. */
  data: unknown;
  /** Anchor in world (scene) coords — node centre, or the hover point for edges. */
  world: { x: number; y: number };
  /** Anchor in screen (canvas-relative) coords, via `camera.toScreen`. */
  screen: { x: number; y: number };
}

/** What `preview:show` / `preview:move` carry. */
export interface PreviewSnapshot {
  target: PreviewTarget;
  card: ResolvedPreviewCard;
  /** Configured placement hint, so the consumer offsets the card consistently. */
  placement: PreviewPlacement;
}

/** Event-map for {@link HoverElementPreviewBehaviour.events}. */
export type HoverElementPreviewEventMap = {
  /** Fired after the dwell delay once an element's card should appear. */
  'preview:show': PreviewSnapshot;
  /** Fired when the anchored card must reposition (camera pan / zoom). */
  'preview:move': PreviewSnapshot;
  /** Fired when the card should disappear. */
  'preview:hide': null;
};

/** Constructor options for `HoverElementPreviewBehaviour`. */
export interface HoverElementPreviewBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour watches. */
  targetLayerId: string;

  /**
   * Which kinds fire a preview. A hover on a kind not listed is ignored.
   * Default `['node', 'edge']`.
   */
  targets?: readonly PreviewTargetKind[];

  /** Dwell, in ms, before a hovered element's card shows. Default `50`. */
  openDelay?: number;

  /**
   * Grace period, in ms, after the pointer leaves before the card hides —
   * smooths jitter when crossing element gaps. Default `50`.
   */
  closeDelay?: number;

  /** Anchor placement hint passed through to the consumer. Default `'bottom-right'`. */
  placement?: PreviewPlacement;

  /**
   * Interactive card — let the pointer enter the card (to select text, click
   * links, scroll) without it vanishing. Default `true`. Set `false` for a
   * passive, click-through tooltip.
   *
   * When `true`, leaving the canvas does **not** hide immediately; instead the
   * `closeDelay` grace timer runs, giving the pointer time to reach the card.
   * The consumer must render the card with pointer events enabled and call
   * {@link HoverElementPreviewBehaviour.holdOpen} on the card's `pointerenter` (to
   * cancel the pending hide) and {@link HoverElementPreviewBehaviour.releaseHold} on
   * its `pointerleave`. Needs a non-zero `closeDelay` to bridge the gap between
   * the element and the card — pair it with e.g. `closeDelay: 200`.
   */
  interactive?: boolean;

  /**
   * Per-target enable predicate. `boolean` is a global on/off; a function runs
   * per hover and may veto showing a card for that element. Default `true`.
   */
  enable?: boolean | ((target: PreviewTarget) => boolean);

  /** The serializable card template. Default `{}` (header strip only). */
  card?: HoverElementPreviewCardSpec;

  /** Fired when a card becomes visible. */
  onShow?: (snapshot: PreviewSnapshot) => void;
  /** Fired when the card hides. */
  onHide?: () => void;
}

interface ResolvedOptions {
  targets: readonly PreviewTargetKind[];
  openDelay: number;
  closeDelay: number;
  placement: PreviewPlacement;
  interactive: boolean;
  enable: boolean | ((target: PreviewTarget) => boolean);
  card: HoverElementPreviewCardSpec;
  onShow: ((snapshot: PreviewSnapshot) => void) | undefined;
  onHide: (() => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<HoverElementPreviewBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    targets: ['node', 'edge'],
    openDelay: 50,
    closeDelay: 50,
    placement: 'bottom-right',
    interactive: true,
    enable: true,
    card: {},
    onShow: undefined,
    onHide: undefined,
  };
  return {
    targets: patch.targets ?? base.targets,
    openDelay: patch.openDelay ?? base.openDelay,
    closeDelay: patch.closeDelay ?? base.closeDelay,
    placement: patch.placement ?? base.placement,
    interactive: patch.interactive ?? base.interactive,
    enable: patch.enable ?? base.enable,
    card: patch.card ?? base.card,
    onShow: 'onShow' in patch ? patch.onShow : base.onShow,
    onHide: 'onHide' in patch ? patch.onHide : base.onHide,
  };
}

// ─── Pure field resolution ──────────────────────────────────────────────────

/** Walk a dotted path against a record. Returns `undefined` on any missing hop. */
function getByPath(subject: unknown, path: PreviewFieldPath): unknown {
  if (!path) return undefined;
  let cur: unknown = subject;
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Coerce a resolved value to a display string, or `undefined` for objects / nullish. */
function toDisplayString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

/** Format a row value per its `format`. `percent` tolerates 0..1 and 0..100 inputs. */
function formatRowValue(value: unknown, format: PreviewRowFormat | undefined): string {
  if (format === 'percent' && typeof value === 'number') {
    const pct = value <= 1 && value >= -1 ? value * 100 : value;
    return `${Math.round(pct)}%`;
  }
  return toDisplayString(value) ?? '';
}

/**
 * Resolve a {@link HoverElementPreviewCardSpec} against a hovered element into a
 * flat, render-ready {@link ResolvedPreviewCard}. Pure — exported so the React
 * `HoverElementPreviewCard` (and tests) reuse the exact same field logic the
 * behaviour emits.
 *
 * The element's `id` and (when present) `type` are **prepended automatically**
 * as the first rows — the consumer never adds them to `spec.rows`.
 *
 * @param spec    The serializable card template.
 * @param subject The store node / edge record to resolve field paths against.
 * @param id      Element id — auto-added as the first `id` row.
 * @param kind    `'node'` | `'edge'`.
 * @param type    Element `type` tag — auto-added as the `type` row when present.
 */
export function resolvePreviewCard(
  spec: HoverElementPreviewCardSpec,
  subject: unknown,
  id: string,
  kind: PreviewTargetKind,
  type: string | undefined,
): ResolvedPreviewCard {
  const imageUrl = spec.image ? toDisplayString(getByPath(subject, spec.image.field)) : undefined;
  const title = spec.title ? toDisplayString(getByPath(subject, spec.title.field)) : undefined;
  const subtitle = spec.subtitle
    ? toDisplayString(getByPath(subject, spec.subtitle.field))
    : undefined;

  // `id` and `type` are structural — auto-prepended so the consumer's spec
  // never has to list them.
  const rows: PreviewCardRow[] = [{ label: 'id', value: id }];
  if (type !== undefined && type !== '') rows.push({ label: 'type', value: type });
  for (const row of spec.rows ?? []) {
    const raw = getByPath(subject, row.field);
    const value = formatRowValue(raw, row.format);
    if (value === '') continue; // drop empty rows
    rows.push({ label: row.label, value });
  }

  const card: ResolvedPreviewCard = {
    id,
    kind,
    imageShape: spec.image?.shape ?? 'rounded',
    subtitleMaxLines: spec.subtitle?.maxLines ?? 2,
    rows,
  };
  if (type !== undefined) card.type = type;
  if (imageUrl !== undefined) card.imageUrl = imageUrl;
  if (title !== undefined) card.title = title;
  if (subtitle !== undefined) card.subtitle = subtitle;
  return card;
}

// ─── Behaviour ──────────────────────────────────────────────────────────────

export class HoverElementPreviewBehaviour extends Behaviour {
  /**
   * Preview event bus. Subscribe to `'preview:show'` / `'preview:move'` /
   * `'preview:hide'` to render and position the card.
   */
  readonly events = new EventEmitter<HoverElementPreviewEventMap>();

  private layer: GraphLayer | null = null;
  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private subs: Array<() => void> = [];

  /** The snapshot currently shown, or `null`. */
  private shown: PreviewSnapshot | null = null;
  /** The target queued by the open timer (awaiting dwell), or `null`. */
  private pending: PreviewTarget | null = null;
  /**
   * `true` while the pointer rests on an interactive card ({@link holdOpen}).
   * Suppresses every hide path — so a late `shape:pointerout` (fired because the
   * DOM card swallowed the pointer over the node) can't close the card after
   * `holdOpen` already cancelled the timer. Order-independent.
   */
  private held = false;

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: HoverElementPreviewBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+hover'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `HoverElementPreviewBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `HoverElementPreviewBehaviour "${this.id}": target layer "${this.targetLayerId}" is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    const onShapeOver = (e: { id: string; worldX: number; worldY: number }) =>
      this.handlePointerOver(e.id, 'node', e.worldX, e.worldY);
    const onShapeOut = (e: { id: string }) => this.handlePointerOut(e.id);
    const onConnOver = (e: { id: string; worldX: number; worldY: number }) =>
      this.handlePointerOver(e.id, 'edge', e.worldX, e.worldY);
    const onConnOut = (e: { id: string }) => this.handlePointerOut(e.id);

    renderer.events.on('shape:pointerover', onShapeOver);
    renderer.events.on('shape:pointerout', onShapeOut);
    renderer.events.on('connector:pointerover', onConnOver);
    renderer.events.on('connector:pointerout', onConnOut);
    this.subs.push(
      () => renderer.events.off('shape:pointerover', onShapeOver),
      () => renderer.events.off('shape:pointerout', onShapeOut),
      () => renderer.events.off('connector:pointerover', onConnOver),
      () => renderer.events.off('connector:pointerout', onConnOut),
    );

    // Reposition the anchored card as the camera moves while it is open.
    const onCameraChange = (): void => this.reposition();
    ctx.events.on('camera:pan', onCameraChange);
    ctx.events.on('camera:zoom', onCameraChange);
    this.subs.push(
      () => ctx.events.off('camera:pan', onCameraChange),
      () => ctx.events.off('camera:zoom', onCameraChange),
    );

    // Pointer leaving the canvas entirely (onto chrome / out of window) stops
    // the renderer's pointer stream, so no `pointerout` fires for the element
    // under the cursor. Passive cards hide immediately; interactive ones use the
    // `closeDelay` grace so the pointer can travel onto the card (which is a DOM
    // overlay *above* the canvas, so reaching it fires this very `pointerleave`)
    // and `holdOpen()` it before the timer matures.
    const el = ctx.canvasElement;
    if (el) {
      const onLeave = (): void => {
        if (this.opts.interactive) this.scheduleHide();
        else this.hideNow();
      };
      el.addEventListener('pointerleave', onLeave);
      this.subs.push(() => el.removeEventListener('pointerleave', onLeave));
    }
  }

  protected override onDestroy(): void {
    this.hideNow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  protected override onDisable(): void {
    this.hideNow();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** The snapshot currently shown, or `null`. */
  get current(): PreviewSnapshot | null {
    return this.shown;
  }

  /** Read-only snapshot of resolved options. */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /**
   * Runtime option update. A `card` / `placement` change re-resolves any
   * in-flight card so the next paint reflects it immediately.
   */
  setOptions(patch: Partial<HoverElementPreviewBehaviourOptions>): void {
    const repaint =
      ('card' in patch && patch.card !== this.opts.card) ||
      (patch.placement !== undefined && patch.placement !== this.opts.placement);
    this.opts = resolveOptions(this.opts, patch);
    if (repaint && this.shown) {
      // Rebuild the snapshot from the live target with the new spec.
      const { target } = this.shown;
      const subject = this.subjectFor(target);
      const card = resolvePreviewCard(
        this.opts.card,
        subject,
        target.id,
        target.kind,
        target.type,
      );
      this.shown = { target, card, placement: this.opts.placement };
      // Re-emit as a full show so consumers re-render content (a `card` change
      // alters the body, not just position).
      this.events.emit('preview:show', this.shown);
      this.opts.onShow?.(this.shown);
    }
  }

  /** Force the card to hide (cancels any pending dwell). */
  hide(): void {
    this.hideNow();
  }

  /**
   * Keep the card open — cancels the pending close timer. Call from the card's
   * `pointerenter` in {@link HoverElementPreviewBehaviourOptions.interactive} mode so
   * the pointer can rest on the card (to select text / click) without it hiding.
   */
  holdOpen(): void {
    this.held = true;
    this.clearCloseTimer();
  }

  /**
   * Release a {@link holdOpen} — restart the `closeDelay` grace timer. Call from
   * the card's `pointerleave` so it hides once the pointer leaves the card.
   */
  releaseHold(): void {
    this.held = false;
    this.scheduleHide();
  }

  // ─── Pointer handlers ─────────────────────────────────────────────────────

  private handlePointerOver(
    id: string,
    kind: PreviewTargetKind,
    worldX: number,
    worldY: number,
  ): void {
    if (!this._enabled) return;
    // While the pointer rests on an interactive card (held open), ignore new
    // element hovers entirely. The renderer hit-tests on `globalpointermove`
    // and can still surface a `pointerover` for an element near or behind the
    // card — that must not hijack the preview the user is interacting with.
    if (this.held) return;
    if (!this.opts.targets.includes(kind)) return;

    const target = this.resolveTarget(id, kind, worldX, worldY);
    if (!target) return;

    const { enable } = this.opts;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(target)) return;

    // A new element cancels any pending close — we either switch to it or dwell.
    this.clearCloseTimer();

    if (this.shown && this.shown.target.id === id) return; // already showing this one
    if (this.pending && this.pending.id === id) return; // already dwelling on this one

    if (this.shown) {
      // Card is already open on a different element — switch immediately, no dwell.
      this.clearOpenTimer();
      this.pending = null;
      this.showTarget(target);
      return;
    }

    // Nothing shown — start the dwell timer.
    this.pending = target;
    this.clearOpenTimer();
    if (this.opts.openDelay <= 0) {
      this.fireOpen();
    } else {
      this.openTimer = setTimeout(() => this.fireOpen(), this.opts.openDelay);
    }
  }

  private handlePointerOut(id: string): void {
    // Cancel a dwell that never matured.
    if (this.pending && this.pending.id === id) {
      this.clearOpenTimer();
      this.pending = null;
      return;
    }
    // Start the grace period before hiding the shown card.
    if (this.shown && this.shown.target.id === id) this.scheduleHide();
  }

  /** Start (or restart) the `closeDelay` grace timer that hides the card. */
  private scheduleHide(): void {
    if (!this.shown) return;
    if (this.held) return; // pointer rests on an interactive card — never auto-hide
    this.clearCloseTimer();
    if (this.opts.closeDelay <= 0) {
      this.hideNow();
    } else {
      this.closeTimer = setTimeout(() => this.hideNow(), this.opts.closeDelay);
    }
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /** Mature the dwell timer — show whatever target is pending. */
  private fireOpen(): void {
    this.openTimer = null;
    const target = this.pending;
    this.pending = null;
    if (target) this.showTarget(target);
  }

  private showTarget(target: PreviewTarget): void {
    this.held = false; // a fresh card isn't held until the pointer enters it
    const subject = this.subjectFor(target);
    const card = resolvePreviewCard(
      this.opts.card,
      subject,
      target.id,
      target.kind,
      target.type,
    );
    this.shown = { target, card, placement: this.opts.placement };
    this.events.emit('preview:show', this.shown);
    this.opts.onShow?.(this.shown);
  }

  private hideNow(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.pending = null;
    this.held = false;
    if (!this.shown) return;
    this.shown = null;
    this.events.emit('preview:hide', null);
    this.opts.onHide?.();
  }

  /** Re-project the shown card's world anchor to screen and emit `preview:move`. */
  private reposition(): void {
    const snapshot = this.shown;
    const ctx = this.ctx;
    if (!snapshot || !ctx) return;
    const screen = ctx.camera.toScreen(snapshot.target.world.x, snapshot.target.world.y);
    const target: PreviewTarget = { ...snapshot.target, screen: { x: screen.x, y: screen.y } };
    this.shown = { ...snapshot, target };
    this.events.emit('preview:move', this.shown);
  }

  /**
   * Resolve a hovered id into a {@link PreviewTarget}. Nodes anchor at their
   * centre (stable across pan / zoom); edges anchor at the hover point
   * `(worldX, worldY)`, which has no single centre. Returns `null` if the
   * element vanished between the pointer event and resolution.
   */
  private resolveTarget(
    id: string,
    kind: PreviewTargetKind,
    worldX: number,
    worldY: number,
  ): PreviewTarget | null {
    const layer = this.layer;
    const ctx = this.ctx;
    if (!layer || !ctx) return null;

    if (kind === 'node') {
      const node = layer.store.getNode(id);
      if (!node) return null;
      const world = node.position ?? layer.store.getPosition(id) ?? { x: worldX, y: worldY };
      const screen = ctx.camera.toScreen(world.x, world.y);
      const target: PreviewTarget = {
        id,
        kind,
        data: node.data,
        world: { x: world.x, y: world.y },
        screen: { x: screen.x, y: screen.y },
      };
      if (node.type !== undefined) target.type = node.type;
      return target;
    }

    const edge = layer.store.getEdge(id);
    if (!edge) return null;
    const screen = ctx.camera.toScreen(worldX, worldY);
    const target: PreviewTarget = {
      id,
      kind,
      data: edge.data,
      world: { x: worldX, y: worldY },
      screen: { x: screen.x, y: screen.y },
    };
    if (edge.type !== undefined) target.type = edge.type;
    return target;
  }

  /** The store record a target's field paths resolve against. */
  private subjectFor(target: PreviewTarget): unknown {
    const layer = this.layer;
    if (!layer) return undefined;
    return target.kind === 'node'
      ? layer.store.getNode(target.id)
      : layer.store.getEdge(target.id);
  }

  private clearOpenTimer(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
