import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { StatCardData } from './types';

/** Full configuration for a {@link StatCard} — edit any field to re-style. */
export interface StatCardSpec {
  width: number;
  height: number;
  padding: number;
  cornerRadius: number;
  /** Left accent bar width (0 to hide it). */
  accentWidth: number;
  bg: number;
  stroke: number;
  captionColor: number;
  valueColor: number;
  upColor: number;
  downColor: number;
}

/** Default {@link StatCardSpec}. */
export const STAT_CARD_DEFAULTS: StatCardSpec = {
  width: 210,
  height: 120,
  padding: 16,
  cornerRadius: 12,
  accentWidth: 4,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  captionColor: 0x94a3b8,
  valueColor: 0xf1f5f9,
  upColor: 0x22c55e,
  downColor: 0xf43f5e,
};

/**
 * **Stat / KPI** tile — a left accent bar, a caption, an accent-tinted icon
 * chip, a large value, and a coloured trend-delta row. Configured by
 * {@link StatCardSpec}; override {@link accentBar} / {@link caption} /
 * {@link iconChip} / {@link value} / {@link delta} for structural changes.
 */
export class StatCard extends CompositeCard<StatCardSpec, StatCardData> {
  constructor(spec: Partial<StatCardSpec> = {}) {
    super({ ...STAT_CARD_DEFAULTS, ...spec });
  }

  /** Left accent bar (clipped to the card corners). */
  protected accentBar(data: StatCardData, parts: CompositePart[]): void {
    if (this.spec.accentWidth > 0) parts.push({ part: 'rect', x: 0, y: 0, width: this.spec.accentWidth, height: this.spec.height, fill: data.accent });
  }

  /** Upper-left caption. */
  protected caption(data: StatCardData, parts: CompositePart[]): void {
    const { padding, width, captionColor } = this.spec;
    parts.push({ part: 'label', x: padding, y: padding, text: data.label.toUpperCase(), fontSize: 11, fontWeight: 600, fill: captionColor, maxWidth: width - padding * 2 - 40, maxLines: 1, overflow: 'ellipsis' });
  }

  /** Accent-tinted icon chip (top-right). */
  protected iconChip(data: StatCardData, parts: CompositePart[]): void {
    if (!data.icon) return;
    const { width, padding } = this.spec;
    const chip = 30;
    const chipX = width - padding - chip;
    parts.push({ part: 'rect', x: chipX, y: padding - 4, width: chip, height: chip, cornerRadius: 8, fill: data.accent, fillAlpha: 0.18 });
    parts.push({ part: 'icon', x: chipX, y: padding - 4, size: chip, icon: { kind: 'svg-url', url: iconifyUrl(data.icon), color: data.accent, strokeWidth: 2, sizeRatio: 0.5 } });
  }

  /** The big value. */
  protected value(data: StatCardData, parts: CompositePart[]): void {
    const { padding, width, valueColor } = this.spec;
    parts.push({ part: 'label', x: padding, y: 48, text: data.value, fontSize: 26, fontWeight: 700, fill: valueColor, maxWidth: width - padding * 2, maxLines: 1, overflow: 'ellipsis' });
  }

  /** Trend-delta row (glyph + text). */
  protected delta(data: StatCardData, parts: CompositePart[]): void {
    if (!data.delta) return;
    const { padding, width, height, upColor, downColor } = this.spec;
    const color = data.trend === 'down' ? downColor : upColor;
    const glyph = data.trend === 'down' ? '▼' : '▲';
    parts.push({ part: 'label', x: padding, y: height - padding - 6, text: glyph, fontSize: 9, fill: color });
    parts.push({ part: 'label', x: padding + 14, y: height - padding - 8, text: `${data.delta} vs last month`, fontSize: 12, fontWeight: 600, fill: color, maxWidth: width - padding * 2 - 14, maxLines: 1, overflow: 'ellipsis' });
  }

  protected parts(data: StatCardData): CompositePart[] {
    const parts: CompositePart[] = [];
    this.accentBar(data, parts);
    this.caption(data, parts);
    this.iconChip(data, parts);
    this.value(data, parts);
    this.delta(data, parts);
    return parts;
  }

  protected frame(): CardFrame {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

const DEFAULT = new StatCard();

/** Convenience builder with the stock spec — `new StatCard().build(data)`. */
export function statCard(data: StatCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
