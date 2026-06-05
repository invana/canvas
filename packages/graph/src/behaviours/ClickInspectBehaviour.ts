/**
 * `ClickInspectBehaviour` — tracks the **single** node / edge a user clicked for
 * *inspection / editing*, independent of {@link ClickSelectBehaviour}.
 *
 * Selection and inspection are different concerns: selection drives highlighting
 * and multi-element drag (and may hold many elements at once); inspection feeds a
 * property editor (`InspectorPanel`), which only ever edits **one** element. This
 * behaviour is the authority for the latter — it remembers the last element
 * clicked and clears on a background click — so the editor never has to reach
 * into the selection set (where a multi-select would leave it with nothing single
 * to show).
 *
 * Layer-scoped: constructed with a target `layerId`. Subscribes to that layer's
 * renderer click events; uses a native DOM `click` listener for the
 * clear-on-background path (the engine doesn't emit `background:click` today),
 * mirroring `ClickSelectBehaviour`.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickInspectBehaviour({ id: 'click-inspect', layerId: 'graph', enabled: true }),
 * );
 * canvas.behaviours.get<ClickInspectBehaviour>('click-inspect')
 *   ?.events.on('inspect:change', (t) => console.log(t)); // { kind, id } | null
 * ```
 */

import { Behaviour, EventEmitter, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** The single element currently targeted for inspection / editing. */
export interface InspectTarget {
  kind: 'node' | 'edge';
  id: string;
}

/** Event-map for {@link ClickInspectBehaviour.events}. */
export type ClickInspectEventMap = {
  /**
   * Fired whenever the inspected element changes — a node / edge click sets it,
   * a background click (or `clear`) sets it to `null`.
   */
  'inspect:change': InspectTarget | null;
};

/** Constructor options for `ClickInspectBehaviour`. */
export interface ClickInspectBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour reads clicks from. */
  layerId: string;

  /** Clear the inspected element when clicking the empty canvas. Default `true`. */
  clearOnBackground?: boolean;
}

export class ClickInspectBehaviour extends Behaviour {
  /**
   * Inspection event bus. Subscribe to `'inspect:change'` for the current
   * single target (or `null`) every time it changes.
   */
  readonly events = new EventEmitter<ClickInspectEventMap>();

  private layer: GraphLayer | null = null;
  private readonly clearOnBackground: boolean;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  /** Current inspected element, or `null`. */
  private target: InspectTarget | null = null;

  /** True when the most recent click already consumed an element. */
  private clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  private pointerDownScreen: { x: number; y: number } | null = null;
  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held — suppresses the synthetic element `click` fired at the end of a
   * node drag so a drag doesn't open the inspector.
   */
  private pressMoved = false;

  constructor(opts: ClickInspectBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
    this.clearOnBackground = opts.clearOnBackground ?? true;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `ClickInspectBehaviour "${this.id}": layer "${this.layerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickInspectBehaviour "${this.id}": target layer is not mounted. ` +
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

    // Background clear — same DOM-`click` carve-out as `ClickSelectBehaviour`:
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

  /** The element currently targeted for inspection, or `null`. */
  getTarget(): InspectTarget | null {
    return this.target;
  }

  /** Set the inspected element explicitly (e.g. from a context menu). */
  setTarget(target: InspectTarget | null): void {
    const same =
      (target === null && this.target === null) ||
      (target !== null &&
        this.target !== null &&
        target.kind === this.target.kind &&
        target.id === this.target.id);
    if (same) return;
    this.target = target;
    this.events.emit('inspect:change', target);
  }

  /** Clear the inspected element. */
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
