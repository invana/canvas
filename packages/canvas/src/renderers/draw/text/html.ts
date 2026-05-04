/**
 * `htmlText` — primitive text: Pixi `HTMLText` (rich-styled, slower) mounted
 * into a parent Container.
 *
 * Same descriptor surface as `plainText` (mount / handle / bounds), different
 * underlying class. Use `htmlText` when you need inline HTML styling (mixed
 * fonts, colors, sizes within one label); use `plainText` for performance-
 * sensitive labels.
 */

import { Container, HTMLText, type HTMLTextStyleOptions } from 'pixi.js';
import type { BaseShapeSpec, Rect, TextHandle, TextKind } from '../types';

export interface HTMLTextSpec extends BaseShapeSpec {
  readonly kind: 'htmlText';
  readonly text: string;
  readonly style?: Partial<HTMLTextStyleOptions>;
  readonly resolution?: number;
}

class HTMLTextHandle implements TextHandle<HTMLTextSpec> {
  private cachedBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    private readonly text: HTMLText,
    private readonly parent: Container,
  ) {}

  update(spec: HTMLTextSpec, ox: number = 0, oy: number = 0, rot: number = 0): void {
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

  private cacheBounds(): void {
    try {
      const w = this.text.width;
      const h = this.text.height;
      if (Number.isFinite(w) && Number.isFinite(h)) {
        this.cachedBounds = { x: -w / 2, y: -h / 2, width: w, height: h };
      }
    } catch {
      /* no DOM canvas context — keep prior bounds */
    }
  }
}

export function mountHTMLText(
  parent: Container,
  spec: HTMLTextSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): HTMLTextHandle {
  const text = new HTMLText({ text: spec.text, style: spec.style, resolution: spec.resolution });
  text.anchor.set(0.5, 0.5);
  parent.addChild(text);
  const handle = new HTMLTextHandle(text, parent);
  handle.update(spec, ox, oy, rot);
  return handle;
}

export function htmlTextBounds(handle: TextHandle<HTMLTextSpec>): Rect {
  return (handle as HTMLTextHandle).getBounds();
}

export const htmlTextKind: TextKind<HTMLTextSpec> = {
  mount: mountHTMLText,
  bounds: htmlTextBounds,
};
