/**
 * `ClickViewBehaviour` — tracks the **single** node / edge a user clicked in
 * order to *view* its properties, independent of {@link ClickSelectBehaviour}
 * and {@link ClickInspectBehaviour}.
 *
 * It is the read-only counterpart of `ClickInspectBehaviour`: where that one
 * feeds an editor, this one feeds a **read-only property viewer**
 * (`PropertyViewerPanel`). It deliberately applies **no visual effect** — node /
 * edge highlighting is owned by `ClickSelectBehaviour`, which can run alongside
 * this one. This behaviour's only job is to remember the last element clicked
 * (clearing on a background click) and announce it via `view:change`, so a
 * viewer panel can show that element's `label` / `type` / `data` without
 * reaching into the (possibly multi-element) selection set.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that layer's
 * renderer click events; uses a native DOM `click` listener for the
 * clear-on-background path (the engine doesn't emit `background:click` today),
 * mirroring `ClickSelectBehaviour` / `ClickInspectBehaviour`.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickViewBehaviour({ id: 'click-view', targetLayerId: 'graph', enabled: true }),
 * );
 * canvas.behaviours.get<ClickViewBehaviour>('click-view')
 *   ?.events.on('view:change', (t) => console.log(t)); // { kind, id } | null
 * ```
 */

import { Behaviour, EventEmitter, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** The single element currently targeted for property viewing. */
export interface ViewTarget {
  kind: 'node' | 'edge';
  id: string;
}

/** Event-map for {@link ClickViewBehaviour.events}. */
export type ClickViewEventMap = {
  /**
   * Fired whenever the viewed element changes — a node / edge click sets it,
   * a background click (or `clear`) sets it to `null`.
   */
  'view:change': ViewTarget | null;
};

/** Constructor options for `ClickViewBehaviour`. */
export interface ClickViewBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour reads clicks from. */
  targetLayerId: string;

  /** Clear the viewed element when clicking the empty canvas. Default `true`. */
  clearOnBackground?: boolean;
}

export class ClickViewBehaviour extends Behaviour {
  /**
   * View event bus. Subscribe to `'view:change'` for the current single target
   * (or `null`) every time it changes.
   */
  readonly events = new EventEmitter<ClickViewEventMap>();

  private layer: GraphLayer | null = null;
  private readonly clearOnBackground: boolean;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  /** Current viewed element, or `null`. */
  private target: ViewTarget | null = null;

  /** True when the most recent click already consumed an element. */
  private clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  private pointerDownScreen: { x: number; y: number } | null = null;
  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held — suppresses the synthetic element `click` fired at the end of a
   * node drag so a drag doesn't open the viewer.
   */
  private pressMoved = false;

  constructor(opts: ClickViewBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
    this.clearOnBackground = opts.clearOnBackground ?? true;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ClickViewBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickViewBehaviour "${this.id}": target layer is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    const onShapeClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, 'node');
    };
    const onConnClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, 'edge');
    };

    // Background clear — same DOM-`click` carve-out as `ClickInspectBehaviour`:
    // PixiJS dispatches `shape:click` / `connector:click` synchronously during
    // the DOM event, so `clickConsumedByElement` is already set when a hit
    // occurred. We also track pointer movement to ignore drags.
    const DRAG_VS_CLICK_THRESHOLD_PX = 4;
    const onPointerDown = (e: PointerEvent) => {
      this.pressMoved = false;
      if (e.button !== 0) {
        this.pointerDownScreen = null;
        return;
      }
      this.pointerDownScreen = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      const down = this.pointerDownScreen;
      if (!down || this.pressMoved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) {
        this.pressMoved = true;
      }
    };
    const onCanvasClick = (e: MouseEvent) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (e.button !== 0) return;
      if (down) {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) return;
      }
      if (this.clearOnBackground) this.clear();
    };

    renderer.events.on('shape:click', onShapeClick);
    renderer.events.on('connector:click', onConnClick);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('click', onCanvasClick);
    }

    this.subs.push(
      () => renderer.events.off('shape:click', onShapeClick),
      () => renderer.events.off('connector:click', onConnClick),
      () => {
        if (el) {
          el.removeEventListener('pointerdown', onPointerDown);
          el.removeEventListener('pointermove', onPointerMove);
          el.removeEventListener('click', onCanvasClick);
        }
      },
    );
  }

  protected override onDestroy(): void {
    this.setTarget(null);
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  protected override onDisable(): void {
    this.setTarget(null);
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** The element currently targeted for viewing, or `null`. */
  getTarget(): ViewTarget | null {
    return this.target;
  }

  /** Set the viewed element explicitly (e.g. from a context menu). */
  setTarget(target: ViewTarget | null): void {
    const same =
      (target === null && this.target === null) ||
      (target !== null &&
        this.target !== null &&
        target.kind === this.target.kind &&
        target.id === this.target.id);
    if (same) return;
    this.target = target;
    this.events.emit('view:change', target);
  }

  /** Clear the viewed element. */
  clear(): void {
    this.setTarget(null);
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private handleElementClick(id: string, kind: 'node' | 'edge'): void {
    if (!this._enabled || !this.layer) return;
    const exists = kind === 'node' ? this.layer.store.hasNode(id) : this.layer.store.hasEdge(id);
    if (!exists) return;
    this.setTarget({ kind, id });
  }
}
