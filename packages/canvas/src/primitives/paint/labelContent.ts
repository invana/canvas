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
    const display = new Text({ text: content.text, style: textStyleFor(content, wrap) });
    display.alpha = content.alpha ?? 1;
    applyMaxLines(display, content, wrap);
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
    t.style = textStyleFor(content, wrap) as never;
    t.text = content.text;
    t.alpha = content.alpha ?? 1;
    applyMaxLines(t, content, wrap);
  } else {
    const h = view.display as HTMLText;
    h.style = htmlStyleFor(content, wrap) as never;
    h.text = htmlBodyFor(content);
    h.alpha = content.alpha ?? 1;
  }
  return view;
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
