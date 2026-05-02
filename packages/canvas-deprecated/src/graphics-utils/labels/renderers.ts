// ── Label text-renderer backends ──────────────────────────────────────────────
// Thin wrapper around PixiJS text classes so Label.ts can switch renderers
// without knowing the differences.  All renderers expose the same surface:
// a single `view` display object, an `update()` method, and `getBounds()`.

import { Text, BitmapText, TextStyle, type Container } from 'pixi.js';
import type { LabelRenderer, LabelStyle } from './types.js';

/** Capped device-pixel-ratio used for raster text resolution. */
const MAX_TEXT_RESOLUTION = 2;

/**
 * Common surface implemented by every text backend so {@link Label} can hold
 * any of them through a single reference.
 */
export interface TextBackend {
  /** Display object to add to the label container. */
  readonly view: Container;
  /** Apply the given style + text. */
  update(text: string, style: LabelStyle): void;
  /** Local bounds of the rendered text (world-space pixels). */
  getBounds(): { width: number; height: number };
  /**
   * Set the rasterization resolution. Triggers re-rasterization on next
   * render for raster backends; no-op for atlas-based backends (BitmapText).
   */
  setResolution(r: number): void;
  destroy(): void;
}

/** Build the appropriate backend for a {@link LabelRenderer} kind. */
export function createTextBackend(kind: LabelRenderer): TextBackend {
  switch (kind) {
    case 'text':   return new PixiTextBackend();
    case 'bitmap': return new PixiBitmapTextBackend();
    case 'html':
      throw new Error(
        `[Label] renderer 'html' is not yet implemented. Use 'text' or 'bitmap'.`,
      );
  }
}

// ── PIXI.Text backend (default) ──────────────────────────────────────────────

class PixiTextBackend implements TextBackend {
  readonly view: Text;

  constructor() {
    this.view = new Text({
      text: '',
      resolution: Math.min(globalThis.devicePixelRatio ?? 1, MAX_TEXT_RESOLUTION),
      roundPixels: true,
    });
    this.view.anchor.set(0.5, 0.5);
    this.view.eventMode = 'none';
  }

  update(text: string, style: LabelStyle): void {
    const ts = this.view.style as TextStyle;
    ts.fontFamily = style.fontFamily ?? 'sans-serif';
    ts.fontSize   = style.fontSize   ?? 12;
    ts.fontWeight = (style.fontWeight ?? 'normal') as TextStyle['fontWeight'];
    ts.fontStyle  = (style.fontStyle  ?? 'normal') as TextStyle['fontStyle'];
    ts.fill       = style.fill       ?? '#ffffff';
    ts.align      = style.align      ?? 'center';

    if (style.stroke && (style.strokeWidth ?? 0) > 0) {
      ts.stroke = { color: style.stroke, width: style.strokeWidth ?? 0 };
    } else {
      // Width 0 disables the outline; setting `undefined` is rejected by the
      // TextStyle type in pixi v8.
      ts.stroke = { color: '#000000', width: 0 };
    }

    if (style.maxWidth !== undefined && style.wordWrap) {
      ts.wordWrap = true;
      ts.wordWrapWidth = style.maxWidth;
    } else {
      ts.wordWrap = false;
    }

    // Truncate (ellipsis) when wrapping is off and maxWidth is set, or when
    // maxLines caps the line count.
    const finalText = applyTruncation(this.view, text, style);
    if (this.view.text !== finalText) this.view.text = finalText;

    this.view.alpha = style.opacity ?? 1;
  }

  getBounds(): { width: number; height: number } {
    return { width: this.view.width, height: this.view.height };
  }

  setResolution(r: number): void {
    if (this.view.resolution !== r) this.view.resolution = r;
  }

  destroy(): void {
    this.view.destroy();
  }
}

/**
 * Apply `maxWidth` truncation (when not wrapping) and `maxLines` truncation.
 * Mutates a temporary single-line measurement on the existing Text instance.
 */
function applyTruncation(view: Text, text: string, style: LabelStyle): string {
  const { maxWidth, wordWrap, maxLines } = style;

  // maxLines truncation: render once, count lines, truncate if needed.
  if (maxLines !== undefined && maxLines > 0) {
    view.text = text;
    const lines = text.split('\n');
    if (lines.length > maxLines) {
      const truncated = lines.slice(0, maxLines).join('\n');
      return truncated.replace(/\n?$/, '…');
    }
  }

  // No truncation needed when wrap is on or no maxWidth set.
  if (wordWrap || maxWidth === undefined) return text;

  // Single-line ellipsis: shrink until it fits.
  view.text = text;
  if (view.width <= maxWidth) return text;

  const ellipsis = '…';
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    view.text = text.slice(0, mid) + ellipsis;
    if (view.width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ellipsis;
}

// ── PIXI.BitmapText backend ──────────────────────────────────────────────────
// Requires the consumer to preload a bitmap font via PIXI Assets before the
// first render of a bitmap-rendered label.  No truncation/wrap support yet.

class PixiBitmapTextBackend implements TextBackend {
  readonly view: BitmapText;

  constructor() {
    this.view = new BitmapText({ text: '', style: { fontFamily: 'sans-serif', fontSize: 12 } });
    this.view.anchor.set(0.5, 0.5);
    this.view.eventMode = 'none';
  }

  update(text: string, style: LabelStyle): void {
    const s = this.view.style;
    s.fontFamily = style.fontFamily ?? 'sans-serif';
    s.fontSize   = style.fontSize   ?? 12;
    s.fill       = style.fill       ?? '#ffffff';
    s.align      = style.align      ?? 'center';
    if (this.view.text !== text) this.view.text = text;
    this.view.alpha = style.opacity ?? 1;
  }

  getBounds(): { width: number; height: number } {
    return { width: this.view.width, height: this.view.height };
  }

  setResolution(_r: number): void {
    // Bitmap fonts are pre-rasterized into a font atlas; resolution is fixed
    // at font-load time, so runtime adjustments are a no-op.
  }

  destroy(): void {
    this.view.destroy();
  }
}
