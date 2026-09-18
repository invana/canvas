import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, metaRow } from './shared';
import type { EventCardData } from './types';

/** Full configuration for an {@link EventCard} — edit any field to re-style. */
export interface EventCardSpec {
  width: number;
  padding: number;
  cornerRadius: number;
  /** Side of the square date chip. */
  dateChipSize: number;
  /** Corner radius of the date chip. */
  dateChipRadius: number;
  /** Height of one meta row (time / venue / attendees). */
  metaRowHeight: number;
  bg: number;
  stroke: number;
  titleColor: number;
  dayColor: number;
  monthColor: number;
  metaColor: number;
  metaIconColor: number;
}

/** Default {@link EventCardSpec}. */
export const EVENT_CARD_DEFAULTS: EventCardSpec = {
  width: 250,
  padding: 14,
  cornerRadius: 12,
  dateChipSize: 52,
  dateChipRadius: 10,
  metaRowHeight: 20,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  titleColor: 0xf1f5f9,
  dayColor: 0xffffff,
  monthColor: 0xffffff,
  metaColor: 0xcbd5e1,
  metaIconColor: 0x94a3b8,
};

/**
 * **Event** card — a solid accent date chip (day over short month) beside a
 * two-line title, then one meta row per present detail: time, venue,
 * attendance.
 *
 * Auto-sizes to the number of meta rows. `day` / `month` are pre-formatted
 * strings, not a `Date` — the card does no locale or timezone work, so the
 * caller decides how a date reads. Configured by {@link EventCardSpec};
 * override {@link dateChip} / {@link title} / {@link metaRows} for structural
 * changes.
 */
export class EventCard extends CompositeCard<EventCardSpec, EventCardData> {
  constructor(spec: Partial<EventCardSpec> = {}) {
    super({ ...EVENT_CARD_DEFAULTS, ...spec });
  }

  /** Solid accent date chip — day over short month. */
  protected dateChip(data: EventCardData, parts: CompositePart[]): void {
    const { padding, dateChipSize: S, dateChipRadius, dayColor, monthColor } = this.spec;
    parts.push({ part: 'rect', x: padding, y: padding, width: S, height: S, cornerRadius: dateChipRadius, fill: data.accent });
    parts.push({ part: 'label', x: padding + S / 2, y: padding + 8, text: data.day, anchor: 'center', fontSize: 20, fontWeight: 700, fill: dayColor });
    parts.push({ part: 'label', x: padding + S / 2, y: padding + S - 17, text: data.month.toUpperCase(), anchor: 'center', fontSize: 10, fontWeight: 600, fill: monthColor });
  }

  /** Two-line event title, beside the date chip. */
  protected title(data: EventCardData, parts: CompositePart[]): void {
    const { padding, dateChipSize, width, titleColor } = this.spec;
    const x = padding + dateChipSize + 12;
    parts.push({ part: 'label', x, y: padding + 4, text: data.title, fontSize: 14, fontWeight: 700, fill: titleColor, maxWidth: width - x - padding, maxLines: 2, overflow: 'ellipsis', lineHeight: 18 });
  }

  /** The meta rows this card renders, in order — only the present ones. */
  protected metaRows(data: EventCardData): Array<{ icon: string; text: string }> {
    const rows: Array<{ icon: string; text: string }> = [];
    if (data.time) rows.push({ icon: 'lucide/clock', text: data.time });
    if (data.venue) rows.push({ icon: 'lucide/map-pin', text: data.venue });
    if (data.attendees) rows.push({ icon: 'lucide/users', text: data.attendees });
    return rows;
  }

  /** Y of the divider, below the date-chip block. */
  protected dividerY(): number {
    return this.spec.padding + this.spec.dateChipSize + 10;
  }

  protected parts(data: EventCardData): CompositePart[] {
    const { padding, width, metaRowHeight, metaColor, metaIconColor, stroke } = this.spec;
    const parts: CompositePart[] = [];
    this.dateChip(data, parts);
    this.title(data, parts);

    const rows = this.metaRows(data);
    if (rows.length > 0) {
      const divY = this.dividerY();
      parts.push({ part: 'line', x: padding, y: divY, x2: width - padding, y2: divY, stroke: { color: stroke, width: 1 } });
      rows.forEach((r, i) => {
        metaRow(parts, { x: padding, y: divY + 10 + i * metaRowHeight, width: width - padding * 2, icon: r.icon, text: r.text, iconColor: metaIconColor, textColor: metaColor });
      });
    }
    return parts;
  }

  protected frame(data: EventCardData): CardFrame {
    const { width, padding, metaRowHeight, bg, stroke, cornerRadius } = this.spec;
    const rows = this.metaRows(data);
    const height = rows.length > 0 ? this.dividerY() + 10 + rows.length * metaRowHeight + padding - 4 : this.dividerY() + padding - 4;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

/** Shared stock instance backing the {@link eventCard} convenience fn. */
const DEFAULT = new EventCard();

/** Convenience builder with the stock spec — `new EventCard().build(data)`. */
export function eventCard(data: EventCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
