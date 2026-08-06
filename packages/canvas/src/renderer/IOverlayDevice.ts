/**
 * `IOverlayDevice` — immediate-mode drawing for **transient** visuals only.
 *
 * A lasso polygon, a brush rectangle, a drag ghost, a minimap viewport
 * rectangle: things that change at pointer or camera rate, mean nothing once the
 * gesture ends, and must never reach history, undo, serialisation or export.
 * Publishing those as specs would put gesture noise into state and force every
 * writer to remember an exclusion flag — so they get their own path instead
 * (`docs/renderer-split-design.md` §3, decision D3).
 *
 * **Not for layer content.** Anything durable — nodes, edges, group frames,
 * contour bands, hulls — is a spec in the store, projected by `SpecProjector`.
 * If a visual survives a reload, it does not belong here.
 *
 * The vocabulary is deliberately the eleven operations the transient visuals in
 * this repo actually use. Every one maps to a `Graphics` path op in pixi and to
 * `BufferGeometry` in three.js, which is what keeps the device portable.
 */

/** Solid fill. Overlays never need image or inset fills. */
export interface OverlayFill {
  readonly color: number;
  readonly alpha?: number;
}

/** Solid stroke, optionally dashed. */
export interface OverlayStroke {
  readonly color: number;
  readonly width: number;
  readonly alpha?: number;
  /** `[dash, gap]` in world units. Omit for a solid line. */
  readonly dashArray?: readonly [number, number];
}

export interface IOverlayDevice {
  /** Erase everything drawn so far. Every redraw starts here. */
  clear(): this;

  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): this;
  closePath(): this;

  rect(x: number, y: number, width: number, height: number): this;
  roundRect(x: number, y: number, width: number, height: number, radius: number): this;
  ellipse(cx: number, cy: number, radiusX: number, radiusY: number): this;
  /** Flat `[x0, y0, x1, y1, …]` or point objects. */
  poly(points: readonly number[] | ReadonlyArray<{ x: number; y: number }>, close?: boolean): this;

  fill(style: OverlayFill): this;
  stroke(style: OverlayStroke): this;

  /** Hide without discarding — cheaper than clear + redraw for a blinking overlay. */
  setVisible(visible: boolean): this;
  /** Paint order against sibling overlays. */
  setZIndex(z: number): this;
  /** Move the whole overlay; useful for screen-space chrome. */
  setPosition(x: number, y: number): this;

  destroy(): void;
}

/** Which space an overlay is drawn in. */
export type OverlaySpace = 'world' | 'screen';
