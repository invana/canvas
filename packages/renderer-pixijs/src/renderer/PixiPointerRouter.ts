/**
 * `PixiPointerRouter` — the canvas's **single** pointer dispatcher.
 *
 * Every `PixiSurface` owns a `PrimitivesRenderer` with its own picking index,
 * but only one of them can win a given press. This router is the one place that
 * decides which: it listens on the stage, walks the registered surfaces in
 * **paint order, topmost first**, asks each one to pick, and dispatches to the
 * first that answers.
 *
 * ## Why it exists
 *
 * Before the renderer split there was exactly one `PrimitivesRenderer` in the
 * engine (built by `GraphLayer`), so it could claim the whole canvas with an
 * always-true `hitArea` and be right. The split gave every layer a surface —
 * and every surface a copy of that router. Pixi resolves **one** target per
 * press and propagates along its ancestor chain, so the topmost always-true
 * container swallowed every press; the HUD layers that sort on top (minimap,
 * dev info, layers panel, legend) don't even draw into the surface they were
 * given, so an empty container was eating node drag, click-select and
 * right-click. See `doc:docs/rfcs/fix/2026-09-11-per-surface-pointer-routers-swallow-picking.md`.
 *
 * ## Coordinate spaces
 *
 * A `world` surface indexes its specs in world coordinates; a `screen` surface
 * indexes them in screen pixels. The old per-surface router ran every hit
 * through `camera.toWorld` regardless — correct for world surfaces, wrong for
 * screen ones. This router asks each surface in **its own** space.
 */

import type { Camera } from '@invana/canvas-core';
import type { Container, FederatedPointerEvent } from 'pixi.js';

import type { PixiSurface } from './PixiSurface';

/** A resolved pick: which surface answered, what it hit, and where in that surface's space. */
interface Resolved {
  readonly surface: PixiSurface;
  readonly hit: NonNullable<ReturnType<PixiSurface['primitives']['hitTest']>>;
  readonly x: number;
  readonly y: number;
}

export class PixiPointerRouter {
  private readonly stage: Container;
  private readonly camera: Camera;
  private readonly canvasElement: HTMLCanvasElement | null;

  /** Registered surfaces, in registration order. Paint order is computed per event. */
  private readonly surfaces: PixiSurface[] = [];

  /**
   * True while any pointer button is held. Hover diffing is suppressed for the
   * duration — without it, dragging a node across its neighbours fires
   * `pointerover` on each one and wakes `HoverActivateBehaviour` mid-drag.
   */
  private pointerDown = false;

  /** Listener disposers, run on {@link destroy}. */
  private readonly unsubs: Array<() => void> = [];

  /**
   * RAF handle + latest move event for the move-coalescing throttle. Raw
   * `globalpointermove` fires hundreds of times a second on a fast sweep; the
   * hit only needs resolving once per animation frame. This used to be one
   * throttle *per surface*, each running its own pick — now it is one for the
   * whole canvas.
   */
  private pendingMove: FederatedPointerEvent | null = null;
  private moveRaf: number | null = null;

  /**
   * Last cursor this router wrote. The move path runs every animation frame, and
   * re-writing an unchanged `style.cursor` dirties the element's style for
   * nothing — so only a *change* reaches the DOM.
   */
  private appliedCursor: string | null = null;

  constructor(opts: { stage: Container; camera: Camera; canvasElement?: HTMLCanvasElement }) {
    this.stage = opts.stage;
    this.camera = opts.camera;
    this.canvasElement = opts.canvasElement ?? null;
    this.install();
  }

  // ─── Registration ────────────────────────────────────────────────────────

  /** Register a surface. Called by `PixiRenderer.createSurface`. */
  add(surface: PixiSurface): void {
    if (!this.surfaces.includes(surface)) this.surfaces.push(surface);
  }

  /** Drop a surface. Called by `PixiSurface.destroy` through the renderer. */
  remove(surface: PixiSurface): void {
    const i = this.surfaces.indexOf(surface);
    if (i >= 0) this.surfaces.splice(i, 1);
  }

  // ─── Install / teardown ──────────────────────────────────────────────────

  /**
   * One listener trio on the stage. The always-true `hitArea` is legitimate
   * here and nowhere else: the stage *is* the whole canvas, so making it the
   * dispatch target costs nothing and competes with no one. Every shape stays
   * `eventMode = 'none'`, so Pixi never walks the scene graph on a pointer
   * event — the pick is ours, answered from the spec-derived rbush index.
   */
  private install(): void {
    const stage = this.stage;
    stage.eventMode = 'static';
    stage.hitArea = { contains: () => true };

    const onMove = (e: FederatedPointerEvent): void => {
      this.pendingMove = e;
      if (this.moveRaf !== null) return;
      this.moveRaf = requestAnimationFrame(() => {
        this.moveRaf = null;
        const pending = this.pendingMove;
        this.pendingMove = null;
        if (pending) this.routeMove(pending);
      });
    };
    const onDown = (e: FederatedPointerEvent): void => this.routeDown(e);
    const onUp = (e: FederatedPointerEvent): void => this.routeUp(e);

    stage.on('globalpointermove', onMove);
    stage.on('pointerdown', onDown);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);

    this.unsubs.push(
      () => stage.off('globalpointermove', onMove),
      () => stage.off('pointerdown', onDown),
      () => stage.off('pointerup', onUp),
      () => stage.off('pointerupoutside', onUp),
    );
  }

  destroy(): void {
    if (this.moveRaf !== null) {
      cancelAnimationFrame(this.moveRaf);
      this.moveRaf = null;
    }
    this.pendingMove = null;
    for (const off of this.unsubs) off();
    this.unsubs.length = 0;
    this.surfaces.length = 0;
    this.pointerDown = false;
    this.appliedCursor = null;
  }

  // ─── Ordering ────────────────────────────────────────────────────────────

  /** Registered surfaces in paint order, topmost first. See {@link orderByPaintOrderTopFirst}. */
  private orderedTopFirst(): PixiSurface[] {
    return orderByPaintOrderTopFirst(this.surfaces, this.stage);
  }

  // ─── Routing ─────────────────────────────────────────────────────────────

  /**
   * The point `e` falls on, expressed in `surface`'s own space: world
   * coordinates for a `world` surface, raw screen pixels for a `screen` one.
   */
  private pointFor(surface: PixiSurface, e: FederatedPointerEvent): { x: number; y: number } {
    if (surface.space === 'screen') return { x: e.global.x, y: e.global.y };
    return this.camera.toWorld(e.global.x, e.global.y);
  }

  /** First surface (topmost) whose press-pick answers, or `null`. */
  private resolvePress(e: FederatedPointerEvent): Resolved | null {
    for (const surface of this.orderedTopFirst()) {
      const { x, y } = this.pointFor(surface, e);
      const hit = surface.primitives.hitTest(x, y);
      if (hit) return { surface, hit, x, y };
    }
    return null;
  }

  private routeMove(e: FederatedPointerEvent): void {
    // Hover state is frozen while a button is held: the target highlighted at
    // press stays highlighted through the drag, and the release's next move
    // resolves the cursor's real target normally.
    if (this.pointerDown) return;

    // Hover uses the hysteresis-aware pick (`pickHoverAt`); press picking stays
    // on the raw `hitTest`, so a press resolves exactly what is under the
    // cursor with no memory of the last hover.
    let winner: Resolved | null = null;
    for (const surface of this.orderedTopFirst()) {
      const { x, y } = this.pointFor(surface, e);
      if (winner) {
        // Lost the pick — let it un-hover whatever it was holding.
        surface.primitives.dispatchMove(null, x, y);
        continue;
      }
      const hit = surface.primitives.pickHoverAt(x, y);
      if (hit) {
        winner = { surface, hit, x, y };
        surface.primitives.dispatchMove(hit, x, y);
      } else {
        surface.primitives.dispatchMove(null, x, y);
      }
    }
    this.applyCursor(winner !== null);
  }

  private routeDown(e: FederatedPointerEvent): void {
    this.pointerDown = true;
    const won = this.resolvePress(e);
    for (const surface of this.surfaces) {
      if (surface !== won?.surface) surface.primitives.clearDown();
    }
    if (won) won.surface.primitives.dispatchDown(won.hit, won.x, won.y, e.button, e.pointerId);
  }

  private routeUp(e: FederatedPointerEvent): void {
    this.pointerDown = false;
    const won = this.resolvePress(e);

    if (!won) {
      // Right-button release on empty canvas → background context menu. There's
      // no element to attribute a pointerup/click to, so this is the only event
      // the renderer surfaces for an empty-canvas right-click. Fanned out to
      // every surface because subscribers listen on their own layer's renderer.
      if (e.button === 2) {
        const w = this.camera.toWorld(e.global.x, e.global.y);
        for (const surface of this.surfaces) {
          surface.primitives.emitBackgroundContextMenu(w.x, w.y);
        }
      }
      for (const surface of this.surfaces) surface.primitives.clearDown();
      return;
    }

    for (const surface of this.surfaces) {
      if (surface !== won.surface) surface.primitives.clearDown();
    }
    won.surface.primitives.dispatchUp(won.hit, won.x, won.y, e.button, e.pointerId);
  }

  /**
   * Hover cursor on the canvas element. Skipped while a press is captured on
   * any surface, so a behaviour that owns the cursor during a drag
   * (`DragNodeBehaviour`'s `'grabbing'`) isn't overridden mid-gesture.
   */
  private applyCursor(over: boolean): void {
    if (!this.canvasElement) return;
    for (const surface of this.surfaces) {
      if (surface.primitives.hasCapturedPress) return;
    }
    const next = over ? 'pointer' : '';
    if (next === this.appliedCursor) return;
    this.appliedCursor = next;
    this.canvasElement.style.cursor = next;
  }
}

/**
 * Order things that own a pixi container by **paint order, topmost first** — so
 * picking order and paint order are the same thing by construction, and a layer
 * that draws over another also picks over it.
 *
 * The key is each root's path from `stop`'s child down, as `(zIndex, childIndex)`
 * per hop, compared lexicographically. A parent not in sorted mode ignores
 * `zIndex` — exactly as Pixi does when it paints — so the key uses the child
 * index alone there. Paths are 2-3 hops and surfaces number a handful, so this
 * costs far less than the redundant per-surface picks it replaces.
 *
 * Exported for its own test: this is the rule the whole fix turns on.
 */
export function orderByPaintOrderTopFirst<T extends { readonly root: Container }>(
  items: readonly T[],
  stop: Container,
): T[] {
  const keyed = items.map((item) => ({ item, key: paintPathKey(item.root, stop) }));
  keyed.sort((a, b) => comparePath(b.key, a.key));
  return keyed.map((k) => k.item);
}

/** `(zIndex, childIndex)` pairs from `stop`'s child down to `node`. */
function paintPathKey(node: Container, stop: Container): number[] {
  const key: number[] = [];
  let cur: Container | null = node;
  while (cur && cur !== stop) {
    const parent: Container | null = cur.parent ?? null;
    if (!parent) break;
    const index = parent.children.indexOf(cur);
    key.unshift(parent.sortableChildren ? cur.zIndex : 0, index);
    cur = parent;
  }
  return key;
}

/** Lexicographic compare of two `(zIndex, childIndex)` paths. Shallower sorts first. */
function comparePath(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return a.length - b.length;
}
