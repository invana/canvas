/**
 * Builds and updates the inner visual of a `LabelDecoration` — a `Text`
 * (plain) or `HTMLText` (rich), with wrap / maxLines / ellipsis applied.
 *
 * Decorations call `mountLabelContent` once on mount, then `updateLabelContent`
 * to mutate the existing Pixi object on style change (cheap — no allocation).
 * Mutation-over-recreation is critical: each Pixi `Text` owns a texture, and
 * a graph with 2 000 labels would burn that many texture uploads per frame
 * if we recreated on every update.
 */

import { Text, HTMLText, type TextStyleOptions } from 'pixi.js';
import type { LabelContent, LabelWrap } from '../types';

export type LabelTextDisplay = Text | HTMLText;

export interface LabelContentView {
  display: LabelTextDisplay;
  kind: LabelContent['kind'];
}

/** Build a fresh Pixi text display from a `LabelContent` + optional wrap. */
export function mountLabelContent(
  content: LabelContent,
  wrap: LabelWrap | undefined,
): LabelContentView {
  if (content.kind === 'text') {
    const effectiveWrap = withDerivedMaxLines(wrap);
    const display = new Text({ text: content.text, style: textStyleFor(content, effectiveWrap) });
    display.alpha = content.alpha ?? 1;
    applyMaxLines(display, content, effectiveWrap);
    return { display, kind: 'text' };
  }
  const display = new HTMLText({ text: htmlBodyFor(content), style: htmlStyleFor(content, wrap) });
  display.alpha = content.alpha ?? 1;
  return { display, kind: 'html-text' };
}

/**
 * Mutate `view` to reflect `content` + `wrap`. Recreates the Pixi instance
 * only when the content kind switches (`text` ↔ `html-text`); otherwise
 * updates `.text` and `.style` in place.
 *
 * Returns the (possibly new) display object so callers can re-parent it on
 * a kind switch.
 */
export function updateLabelContent(
  view: LabelContentView,
  content: LabelContent,
  wrap: LabelWrap | undefined,
): LabelContentView {
  if (view.kind !== content.kind) {
    view.display.destroy();
    return mountLabelContent(content, wrap);
  }

  if (content.kind === 'text') {
    const t = view.display as Text;
    const effectiveWrap = withDerivedMaxLines(wrap);
    t.style = textStyleFor(content, effectiveWrap) as never;
    t.text = content.text;
    t.alpha = content.alpha ?? 1;
    applyMaxLines(t, content, effectiveWrap);
  } else {
    const h = view.display as HTMLText;
    h.style = htmlStyleFor(content, wrap) as never;
    h.text = htmlBodyFor(content);
    h.alpha = content.alpha ?? 1;
  }
  return view;
}

/**
 * Set the rasterisation resolution of the underlying Pixi text. Higher
 * resolution = sharper glyphs when the camera is zoomed in, at the cost of
 * a larger glyph texture. Setting the same value twice is a no-op in Pixi
 * (it short-circuits the re-rasterise), so callers can re-invoke freely.
 */
export function applyLabelResolution(view: LabelContentView, resolution: number): void {
  if (resolution <= 0 || !Number.isFinite(resolution)) return;
  (view.display as unknown as { resolution: number }).resolution = resolution;
}

// ─── Style builders ────────────────────────────────────────────────────────

function textStyleFor(
  content: Extract<LabelContent, { kind: 'text' }>,
  wrap: LabelWrap | undefined,
): TextStyleOptions {
  const wantsWrap = wrap?.wordWrap === true || (wrap?.maxWidth !== undefined);
  const style: TextStyleOptions = {
    fontFamily: content.fontFamily ?? 'sans-serif',
    fontSize: content.fontSize ?? 12,
    fill: content.fill ?? 0x111827,
    align: content.align ?? 'center',
  };
  if (content.fontWeight !== undefined) style.fontWeight = content.fontWeight as never;
  if (content.fontStyle !== undefined) style.fontStyle = content.fontStyle;
  if (content.fontVariant !== undefined) style.fontVariant = content.fontVariant as never;
  if (content.letterSpacing !== undefined) style.letterSpacing = content.letterSpacing;
  if (content.lineHeight !== undefined) style.lineHeight = content.lineHeight;
  if (wantsWrap) {
    style.wordWrap = true;
    if (wrap?.maxWidth !== undefined) style.wordWrapWidth = wrap.maxWidth;
  }
  if (content.stroke) {
    style.stroke = { color: content.stroke.color, width: content.stroke.width };
  }
  if (content.shadow) {
    style.dropShadow = {
      color: content.shadow.color,
      blur: content.shadow.blur ?? 0,
      distance: Math.hypot(content.shadow.offsetX ?? 0, content.shadow.offsetY ?? 2),
      angle: Math.atan2(content.shadow.offsetY ?? 2, content.shadow.offsetX ?? 0),
      alpha: content.shadow.alpha ?? 0.5,
    };
  }
  return style;
}

function htmlStyleFor(
  content: Extract<LabelContent, { kind: 'html-text' }>,
  wrap: LabelWrap | undefined,
): Record<string, unknown> {
  const style: Record<string, unknown> = {
    fontFamily: content.defaultFontFamily ?? 'sans-serif',
    fontSize: content.defaultFontSize ?? 12,
    fill: content.defaultFill ?? 0x111827,
  };
  if (content.defaultFontWeight !== undefined) style.fontWeight = content.defaultFontWeight;
  if (content.width !== undefined) style.wordWrapWidth = content.width;
  if (wrap?.maxWidth !== undefined && style.wordWrapWidth === undefined) {
    style.wordWrapWidth = wrap.maxWidth;
  }
  if (style.wordWrapWidth !== undefined) style.wordWrap = true;
  if (content.tagStyles) style.tagStyles = content.tagStyles;
  if (content.cssOverrides) style.cssOverrides = content.cssOverrides;
  return style;
}

function htmlBodyFor(content: Extract<LabelContent, { kind: 'html-text' }>): string {
  return content.html;
}

// ─── Wrap / ellipsis truncation pass ───────────────────────────────────────

/**
 * Enforce `wrap.maxLines` by truncating the text and re-rendering until the
 * line count fits. Only used for plain `Text`; `HTMLText` doesn't expose an
 * easy line-count probe and is documented to support `maxLines` natively via
 * the host's CSS (`-webkit-line-clamp`) — out of scope for v0.
 */
function applyMaxLines(
  display: Text,
  content: Extract<LabelContent, { kind: 'text' }>,
  wrap: LabelWrap | undefined,
): void {
  if (!wrap || !wrap.maxLines || wrap.maxLines < 1) return;
  const overflow = wrap.overflow ?? 'ellipsis';

  const lineHeight = effectiveLineHeight(display);
  if (lineHeight <= 0) return;

  if (currentLineCount(display, lineHeight) <= wrap.maxLines) return;

  const original = content.text;
  let lo = 0;
  let hi = original.length;
  // Binary search the longest character prefix that fits in maxLines (with
  // ellipsis appended when overflow === 'ellipsis').
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    const candidate = overflow === 'ellipsis'
      ? original.slice(0, mid).replace(/\s+$/, '') + '…'
      : original.slice(0, mid);
    display.text = candidate;
    if (currentLineCount(display, lineHeight) <= wrap.maxLines) lo = mid;
    else hi = mid - 1;
  }

  display.text = overflow === 'ellipsis'
    ? original.slice(0, lo).replace(/\s+$/, '') + '…'
    : original.slice(0, lo);
}

/**
 * If `wrap.maxHeight` is set, derive a `maxLines` cap from it by dividing by
 * the line height that would render at the configured `fontSize`. The result
 * is min-combined with any caller-provided `maxLines` so the smaller wins.
 *
 * Returns the same `wrap` object (with a possibly tightened `maxLines`).
 */
function withDerivedMaxLines(wrap: LabelWrap | undefined): LabelWrap | undefined {
  if (!wrap || wrap.maxHeight === undefined || wrap.maxHeight <= 0) return wrap;
  // The line height used here is a coarse estimate (we don't have the rendered
  // Text yet). It's refined once the display is mounted; the value here just
  // sets an upper bound on `maxLines` for the initial mount. A line height of
  // ~14.4 (`12 * 1.2`) for the default font is the worst-case ascent.
  const approxLineHeight = 14.4;
  const derivedMaxLines = Math.max(1, Math.floor(wrap.maxHeight / approxLineHeight));
  const combinedMaxLines = wrap.maxLines !== undefined
    ? Math.min(wrap.maxLines, derivedMaxLines)
    : derivedMaxLines;
  return { ...wrap, maxLines: combinedMaxLines };
}

/**
 * Constrain the label's rendered geometry to fit inside `box`. Applies a
 * three-step cascade and mutates the underlying Pixi `Text` in place:
 *
 * 1. **Shrink** — binary-search the largest `fontSize ∈ [minFontSize, configured]`
 *    such that the wrapped text fits both `box.width` and `box.height`.
 * 2. **Truncate** — at `minFontSize`, derive `maxLines = floor(box.height / lineHeight)`
 *    and re-run the existing ellipsis truncation pass on top.
 * 3. **Hide** — if even the truncated label still overflows, return `hidden: true`
 *    so the caller can set `alpha = 0`.
 *
 * Inside-placement decorations call this after `mountLabelContent` /
 * `updateLabelContent` and before measuring the display for positioning.
 * HTMLText is currently a no-op (no line-count probe available in v0).
 */
export function fitInsideBox(
  view: LabelContentView,
  content: LabelContent,
  wrap: LabelWrap | undefined,
  box: { width: number; height: number },
  minFontSize: number,
): { hidden: boolean } {
  if (box.width <= 0 || box.height <= 0) return { hidden: true };
  if (content.kind !== 'text') return { hidden: false };
  const display = view.display as Text;
  const configuredFontSize = content.fontSize ?? 12;
  const floor = Math.max(1, minFontSize);

  // Effective wrap forces wordWrap to box width so multi-word labels can break
  // across lines, and caps maxHeight at the box.
  const widthBudget = Math.max(1, box.width);
  const heightBudget = Math.max(1, box.height);
  const baseWrap: LabelWrap = {
    ...(wrap ?? {}),
    maxWidth: Math.min(wrap?.maxWidth ?? Infinity, widthBudget),
    maxHeight: Math.min(wrap?.maxHeight ?? Infinity, heightBudget),
    wordWrap: true,
  };

  const applyAt = (fontSize: number): void => {
    const sizedContent = { ...content, fontSize } as Extract<LabelContent, { kind: 'text' }>;
    display.style = textStyleFor(sizedContent, baseWrap) as never;
    display.text = content.text;
  };

  applyAt(configuredFontSize);
  if (display.width <= widthBudget + 0.5 && display.height <= heightBudget + 0.5) {
    return { hidden: false };
  }

  // Step 1: binary-search font size down to floor.
  let lo = floor;
  let hi = configuredFontSize;
  let bestFit = -1;
  // Step size of 0.5 px is enough; Pixi rounds to integer subpixels anyway.
  while (hi - lo >= 0.5) {
    const mid = (lo + hi) / 2;
    applyAt(mid);
    if (display.width <= widthBudget + 0.5 && display.height <= heightBudget + 0.5) {
      bestFit = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  if (bestFit > 0) {
    applyAt(bestFit);
    return { hidden: false };
  }

  // Step 2: at floor font size, derive maxLines from box height and let
  // applyMaxLines truncate with ellipsis.
  applyAt(floor);
  const lineHeight = effectiveLineHeight(display);
  if (lineHeight <= 0) return { hidden: true };
  const derivedMaxLines = Math.max(1, Math.floor(heightBudget / lineHeight));
  applyMaxLines(display, content, { ...baseWrap, maxLines: derivedMaxLines, overflow: 'ellipsis' });

  // After truncation, the text may still be wider than the box if Pixi's
  // wordWrap couldn't break a single long word. In that case, prefix-shrink
  // the text on width directly.
  if (display.width > widthBudget + 0.5) {
    truncateToWidth(display, widthBudget);
  }

  // Step 3: if it still doesn't fit, hide.
  if (display.width > widthBudget + 0.5 || display.height > heightBudget + 0.5) {
    return { hidden: true };
  }
  return { hidden: false };
}

/**
 * Prefix-binary-search the text on `display` down to the longest prefix that
 * fits within `widthBudget` after appending an ellipsis. Used as a last resort
 * inside `fitInsideBox` when Pixi's wordWrap can't break a long single token.
 */
function truncateToWidth(display: Text, widthBudget: number): void {
  const original = display.text;
  let lo = 0;
  let hi = original.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    display.text = original.slice(0, mid).replace(/\s+$/, '') + '…';
    if (display.width <= widthBudget + 0.5) lo = mid;
    else hi = mid - 1;
  }
  if (lo <= 0) {
    // Not even an ellipsis fits — leave the text empty so width collapses;
    // caller will hide via the post-check.
    display.text = '';
  } else {
    display.text = original.slice(0, lo).replace(/\s+$/, '') + '…';
  }
}

function effectiveLineHeight(display: Text): number {
  const style = display.style as unknown as {
    lineHeight?: number;
    fontSize?: number;
    leading?: number;
  };
  const ascent = style.fontSize ?? 12;
  return style.lineHeight && style.lineHeight > 0 ? style.lineHeight : ascent * 1.2;
}

function currentLineCount(display: Text, lineHeight: number): number {
  // Pixi v8 exposes height after layout. Round to nearest integer line count.
  // Tolerance avoids off-by-one when height ≈ N * lineHeight + ε.
  const lines = display.height / lineHeight;
  return Math.max(1, Math.round(lines + 0.001));
}
