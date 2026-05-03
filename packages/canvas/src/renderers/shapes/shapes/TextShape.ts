/**
 * `TextShape` — built-in primitive registered as kind `'text'`.
 *
 * Wraps pixi's `Text` (CanvasText). The local-space bbox uses the rendered
 * text's `width` / `height` after `draw()`, anchored to the center.
 *
 * Heads up: `Text` rasterises on the CPU on every style/text mutation.
 * For label-heavy scenes the host Layer should call `rasteriseLabel(id, dpr)`
 * to mark the texture for atlas re-bake at higher resolution (Step 8). For
 * thousands of moving labels, prefer a domain-specific bitmap-text variant.
 */

import { Container, Text, type TextStyleOptions } from 'pixi.js';
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';

export interface TextShapeSpec extends BaseShapeSpec {
  readonly kind: 'text';
  readonly text: string;
  /** Forwarded to pixi's `TextStyle`. See pixi docs for the full option set. */
  readonly style?: Partial<TextStyleOptions>;
  /**
   * Optional resolution multiplier for the underlying canvas raster.
   * `setLODLevel` / `rasteriseLabel` (Step 8) drive this dynamically.
   */
  readonly resolution?: number;
}

export class TextShape implements IShape<TextShapeSpec> {
  readonly gfx: Container;
  private readonly text: Text;
  // Cached after each successful `draw()` so `bounds()` is O(1) and doesn't
  // re-trigger pixi's text-metrics path on every hit-test. Also makes the
  // shape resilient in environments without a real `<canvas>` 2D context
  // (happy-dom in tests): if measurement throws, the last good bounds stay.
  private cachedBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(spec: TextShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'shape:text';
    this.text = new Text({
      text: spec.text,
      style: spec.style,
      resolution: spec.resolution,
    });
    this.text.anchor.set(0.5, 0.5);
    this.gfx.addChild(this.text);
    host.surface.addChild(this.gfx);
  }

  draw(spec: TextShapeSpec): void {
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    if (this.text.text !== spec.text) this.text.text = spec.text;
    if (spec.style) {
      // Reassigning .style triggers pixi's TextStyle copy + raster invalidation.
      this.text.style = spec.style;
    }
    if (spec.resolution !== undefined && this.text.resolution !== spec.resolution) {
      this.text.resolution = spec.resolution;
    }
    this.cacheBounds();
  }

  bounds(): Rect {
    return this.cachedBounds;
  }

  /**
   * Re-rasterise the underlying text at a new resolution. Driven by
   * `ShapesRenderer.rasteriseLabel(id, resolution)`. Idempotent — re-setting
   * the same resolution is a no-op (pixi short-circuits internally too).
   */
  setLabelResolution(resolution: number): void {
    if (this.text.resolution === resolution) return;
    this.text.resolution = resolution;
    this.cacheBounds();
  }

  /** Best-effort raster-aware bounds. No-throw — keeps last good value on error. */
  private cacheBounds(): void {
    try {
      const w = this.text.width;
      const h = this.text.height;
      if (Number.isFinite(w) && Number.isFinite(h)) {
        this.cachedBounds = { x: -w / 2, y: -h / 2, width: w, height: h };
      }
    } catch {
      /* no DOM canvas context (e.g. happy-dom in tests) — keep prior bounds */
    }
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }
}
