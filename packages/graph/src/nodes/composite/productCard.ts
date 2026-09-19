import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, chip, iconifyUrl } from './shared';
import type { ProductCardData } from './types';

/** Pill colour per stock state. */
const STOCK_COLOR: Record<NonNullable<ProductCardData['stock']>, number> = {
  in: 0x22c55e,
  low: 0xf59e0b,
  out: 0xf43f5e,
};

/** Pill copy per stock state. */
const STOCK_LABEL: Record<NonNullable<ProductCardData['stock']>, string> = {
  in: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
};

/** Full configuration for a {@link ProductCard} — edit any field to re-style. */
export interface ProductCardSpec {
  width: number;
  padding: number;
  cornerRadius: number;
  /** Height of the accent-tinted media band at the top (0 to hide it). */
  mediaHeight: number;
  /** Height reserved for the tag-chip row when tags are present. */
  tagRowHeight: number;
  /**
   * Corner radius of the stock pill and tag chips, in pixels. Half the chip's
   * height reads as a full pill; drop it toward `4` for a squarer tag.
   */
  chipRadius: number;
  bg: number;
  stroke: number;
  titleColor: number;
  priceColor: number;
  ratingColor: number;
  reviewColor: number;
}

/** Default {@link ProductCardSpec}. */
export const PRODUCT_CARD_DEFAULTS: ProductCardSpec = {
  width: 220,
  padding: 14,
  cornerRadius: 12,
  mediaHeight: 96,
  tagRowHeight: 26,
  chipRadius: 9,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 0xf1f5f9,
  priceColor: 0xf1f5f9,
  ratingColor: 0xf59e0b,
  reviewColor: 0x64748b,
};

/**
 * **Product / catalogue item** card — an accent-tinted media band with a
 * centred icon, a two-line title, a price beside a star rating, an optional
 * stock pill, and a row of tag chips.
 *
 * The media band runs edge to edge and relies on the frame's `clip` to follow
 * the rounded corners — a `rect` part is square geometry and can't round one on
 * its own. Auto-sizes to whether tags are present. Configured by
 * {@link ProductCardSpec}; override {@link media} / {@link title} /
 * {@link priceRow} / {@link tags} for structural changes.
 */
export class ProductCard extends CompositeCard<ProductCardSpec, ProductCardData> {
  constructor(spec: Partial<ProductCardSpec> = {}) {
    super({ ...PRODUCT_CARD_DEFAULTS, ...spec });
  }

  /** Accent-tinted media band with a centred icon. */
  protected media(data: ProductCardData, parts: CompositePart[]): void {
    const { width, mediaHeight: H } = this.spec;
    if (H <= 0) return;
    parts.push({ part: 'rect', x: 0, y: 0, width, height: H, fill: data.accent, fillAlpha: 0.16 });
    if (data.icon) {
      const box = Math.min(H - 24, 48);
      parts.push({ part: 'icon', x: (width - box) / 2, y: (H - box) / 2, size: box, icon: { kind: 'svg-url', url: iconifyUrl(data.icon), color: data.accent, strokeWidth: 2 } });
    }
  }

  /** Two-line product title below the media band. */
  protected title(data: ProductCardData, parts: CompositePart[]): void {
    const { width, padding, mediaHeight, titleColor } = this.spec;
    parts.push({ part: 'label', x: padding, y: mediaHeight + padding - 2, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, align: 'left', maxWidth: width - padding * 2, maxLines: 2, overflow: 'ellipsis', lineHeight: 18 });
  }

  /** Y of the price row — below a title laid out as two lines. */
  protected priceRowY(): number {
    return this.spec.mediaHeight + this.spec.padding + 40;
  }

  /** Price (left) + star rating and review count (right). */
  protected priceRow(data: ProductCardData, parts: CompositePart[]): void {
    const { width, padding, priceColor, ratingColor, reviewColor } = this.spec;
    const y = this.priceRowY();
    parts.push({ part: 'label', x: padding, y, text: data.price, fontSize: 16, fontWeight: 700, fill: priceColor, maxWidth: width * 0.5, maxLines: 1, overflow: 'ellipsis' });
    if (data.rating === undefined) return;
    const text = data.reviews === undefined ? data.rating.toFixed(1) : `${data.rating.toFixed(1)} (${data.reviews})`;
    parts.push({ part: 'label', x: width - padding, y: y + 3, text, anchor: 'right', fontSize: 11, fontWeight: 600, fill: reviewColor, maxWidth: width * 0.4, maxLines: 1, overflow: 'ellipsis' });
    parts.push({ part: 'icon', x: width - padding - text.length * 6 - 16, y: y + 2, size: 13, icon: { kind: 'svg-url', url: iconifyUrl('lucide/star'), color: ratingColor, strokeWidth: 2 } });
  }

  /** Stock pill + tag chips, left → right. */
  protected tags(data: ProductCardData, parts: CompositePart[]): void {
    const { padding, chipRadius } = this.spec;
    const y = this.priceRowY() + 28;
    let x = padding;
    if (data.stock) x += chip(parts, { x, y, text: STOCK_LABEL[data.stock], color: STOCK_COLOR[data.stock], cornerRadius: chipRadius }) + 6;
    for (const tag of data.tags ?? []) x += chip(parts, { x, y, text: tag.label, color: tag.color, cornerRadius: chipRadius }) + 6;
  }

  /** Whether this card renders a chip row at all. */
  protected hasTagRow(data: ProductCardData): boolean {
    return data.stock !== undefined || (data.tags?.length ?? 0) > 0;
  }

  protected parts(data: ProductCardData): CompositePart[] {
    const parts: CompositePart[] = [];
    this.media(data, parts);
    this.title(data, parts);
    this.priceRow(data, parts);
    if (this.hasTagRow(data)) this.tags(data, parts);
    return parts;
  }

  protected frame(data: ProductCardData): CardFrame {
    const { width, padding, tagRowHeight, bg, stroke, cornerRadius } = this.spec;
    const height = this.priceRowY() + 24 + (this.hasTagRow(data) ? tagRowHeight : 0) + padding - 8;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

/** Shared stock instance backing the {@link productCard} convenience fn. */
const DEFAULT = new ProductCard();

/** Convenience builder with the stock spec — `new ProductCard().build(data)`. */
export function productCard(data: ProductCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
