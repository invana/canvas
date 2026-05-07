/**
 * `plainText` — primitive text: Pixi `Text` (canvas-rasterised) mounted into
 * a parent Container.
 *
 * Text is fundamentally different from geometric primitives: Pixi `Text` is a
 * raster display object, not Graphics calls. It cannot share a parent's
 * Graphics like a circle can. So instead of `draw(g, ...)`, the primitive
 * `mount`s a Text into a parent Container and returns a handle for updates.
 *
 * Convention: spec `(x, y)` is the **center** of the text's bbox (`anchor =
 * (0.5, 0.5)`). `setLabelResolution` re-rasterises at a new DPR for crisp
 * text under zoom — driven by the host Layer's LOD policy.
 */

import { Container, Text, type TextStyleOptions } from 'pixi.js';
import type { BaseShapeSpec, Rect, TextHandle, TextKind } from '../types';

export interface PlainTextSpec extends BaseShapeSpec {
  readonly kind: 'plainText';
  readonly text: string;
  /** Forwarded to Pixi's `TextStyle`. */
  readonly style?: Partial<TextStyleOptions>;
  /** Optional resolution multiplier for the underlying canvas raster. */
  readonly resolution?: number;
}

class PlainTextHandle implements TextHandle<PlainTextSpec> {
  private cachedBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    private readonly text: Text,
    private readonly parent: Container,
  ) {}

  update(spec: PlainTextSpec, ox: number = 0, oy: number = 0, rot: number = 0): void {
    if (this.text.text !== spec.text) this.text.text = spec.text;
    if (spec.style) this.text.style = spec.style;
    if (spec.resolution !== undefined && this.text.resolution !== spec.resolution) {
      this.text.resolution = spec.resolution;
    }
    this.text.position.set(ox, oy);
    this.text.rotation = rot;
    this.text.alpha = spec.alpha ?? 1;
    this.text.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.text.zIndex = spec.zIndex;
    this.cacheBounds();
  }

  setLabelResolution(resolution: number): void {
    if (this.text.resolution === resolution) return;
    this.text.resolution = resolution;
    this.cacheBounds();
  }

  destroy(): void {
    this.parent.removeChild(this.text);
    this.text.destroy();
  }

  getBounds(): Rect {
    return this.cachedBounds;
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
}

export function mountPlainText(
  parent: Container,
  spec: PlainTextSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): PlainTextHandle {
  const text = new Text({ text: spec.text, style: spec.style, resolution: spec.resolution });
  text.anchor.set(0.5, 0.5);
  parent.addChild(text);
  const handle = new PlainTextHandle(text, parent);
  handle.update(spec, ox, oy, rot);
  return handle;
}

export function plainTextBounds(handle: TextHandle<PlainTextSpec>): Rect {
  return (handle as PlainTextHandle).getBounds();
}

export const plainTextKind: TextKind<PlainTextSpec> = {
  mount: mountPlainText,
  bounds: plainTextBounds,
};
