/**
 * The on-screen label-size options shared by `NodeLabelLODBehaviour` and
 * `EdgeLabelLODBehaviour`, and their translation into the renderer's
 * `LabelSizePolicy`.
 */

import type { LabelSizePolicy } from '@invana/canvas';

/**
 * How big a label reads **on screen** as the camera zooms. All three are
 * optional and unset changes nothing — the label keeps the size its host gives
 * it today. Sizes are CSS pixels; a label's authored `labelFontSize` is its
 * on-screen size at camera zoom `1`.
 */
export interface LabelSizeOptions {
  /**
   * How on-screen size follows camera zoom: `fontSize × zoom ^ zoomGrowth`.
   * `1` grows with the world, `0.5` with its square root, `0` keeps each
   * label's own font size on screen (relative sizes between labels survive).
   * Clamped to `[0, 1]`. Omit (or `null`) to keep the size the node gives the
   * label — world-scaled, or pixel-constant under `NodeScaleLODBehaviour`.
   */
  zoomGrowth?: number | null;
  /**
   * Smallest on-screen font size in CSS px — keeps zoomed-out labels readable.
   * Omit, `null` or `≤ 0` for no floor.
   */
  minFontPx?: number | null;
  /**
   * Largest on-screen font size in CSS px — stops labels ballooning when zoomed
   * in. Omit, `null` or `≤ 0` for no cap (a 0 px cap would collapse every label).
   */
  maxFontPx?: number | null;
}

/** A font bound that means something: a positive number, else `undefined` (unset). */
function fontBound(v: number | null | undefined): number | undefined {
  return typeof v === 'number' && v > 0 ? v : undefined;
}

/**
 * The renderer policy for `opts`, or `null` when none of the size options is
 * set (labels keep their natural size, and a previously pushed policy is
 * cleared). `null` and non-positive font bounds count as unset — `null` is how
 * a serialisable patch (the settings editor, `canvas.update`) clears an option.
 */
export function labelSizePolicyOf(opts: LabelSizeOptions): LabelSizePolicy | null {
  const zoomGrowth = opts.zoomGrowth ?? undefined;
  const minFontPx = fontBound(opts.minFontPx);
  const maxFontPx = fontBound(opts.maxFontPx);
  if (zoomGrowth === undefined && minFontPx === undefined && maxFontPx === undefined) return null;
  return {
    ...(zoomGrowth !== undefined ? { zoomGrowth } : {}),
    ...(minFontPx !== undefined ? { minFontPx } : {}),
    ...(maxFontPx !== undefined ? { maxFontPx } : {}),
  };
}
