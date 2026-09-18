import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, chip, iconifyUrl, metaRow } from './shared';
import type { OrganisationCardData } from './types';

/** Full configuration for an {@link OrganisationCard} — edit any field to re-style. */
export interface OrganisationCardSpec {
  width: number;
  padding: number;
  cornerRadius: number;
  /** Side of the square logo chip. */
  logoSize: number;
  /** Corner radius of the logo chip. */
  logoRadius: number;
  /** Height of one meta row (location / headcount / founded). */
  metaRowHeight: number;
  bg: number;
  stroke: number;
  nameColor: number;
  metaColor: number;
  metaIconColor: number;
}

/** Default {@link OrganisationCardSpec}. */
export const ORGANISATION_CARD_DEFAULTS: OrganisationCardSpec = {
  width: 250,
  padding: 16,
  cornerRadius: 12,
  logoSize: 40,
  logoRadius: 8,
  metaRowHeight: 22,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  nameColor: 0xf1f5f9,
  metaColor: 0xcbd5e1,
  metaIconColor: 0x94a3b8,
};

/**
 * **Organisation** card — a logo chip (icon, or a monogram when there's no
 * logo) beside the organisation name and an entity-type tag, a divider, then
 * one meta row per present detail: location, headcount, founding note.
 *
 * Auto-sizes to the number of meta rows, so a bare `{ name, accent }` card is
 * short and a fully-populated one is tall — absent fields leave no gap.
 * Configured by {@link OrganisationCardSpec}; override {@link logo} /
 * {@link identity} / {@link metaRows} for structural changes.
 */
export class OrganisationCard extends CompositeCard<OrganisationCardSpec, OrganisationCardData> {
  constructor(spec: Partial<OrganisationCardSpec> = {}) {
    super({ ...ORGANISATION_CARD_DEFAULTS, ...spec });
  }

  /** Logo chip — the `logo` icon, or `monogram` on an accent-tinted square. */
  protected logo(data: OrganisationCardData, parts: CompositePart[]): void {
    const { padding, logoSize: S, logoRadius } = this.spec;
    parts.push({ part: 'rect', x: padding, y: padding, width: S, height: S, cornerRadius: logoRadius, fill: data.accent, fillAlpha: 0.22 });
    if (data.logo) {
      parts.push({ part: 'icon', x: padding, y: padding, size: S, icon: { kind: 'svg-url', url: iconifyUrl(data.logo), color: data.accent, strokeWidth: 2, sizeRatio: 0.55 } });
    } else if (data.monogram) {
      parts.push({ part: 'label', x: padding + S / 2, y: padding + (S - 16) / 2, text: data.monogram.toUpperCase(), anchor: 'center', fontSize: 16, fontWeight: 700, fill: data.accent });
    }
  }

  /** Name + entity-type tag, beside the logo chip. */
  protected identity(data: OrganisationCardData, parts: CompositePart[]): void {
    const { padding, logoSize, width, nameColor } = this.spec;
    const x = padding + logoSize + 12;
    const maxWidth = width - x - padding;
    parts.push({ part: 'label', x, y: padding + 2, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth, maxLines: 1, overflow: 'ellipsis' });
    if (data.kind) chip(parts, { x, y: padding + 22, text: data.kind, color: data.accent, height: 17, fontSize: 10 });
  }

  /** The meta rows this card renders, in order — only the present ones. */
  protected metaRows(data: OrganisationCardData): Array<{ icon: string; text: string }> {
    const rows: Array<{ icon: string; text: string }> = [];
    if (data.location) rows.push({ icon: 'lucide/map-pin', text: data.location });
    if (data.headcount) rows.push({ icon: 'lucide/users', text: data.headcount });
    if (data.founded) rows.push({ icon: 'lucide/calendar', text: data.founded });
    return rows;
  }

  /** Y of the divider, below the logo block. */
  protected dividerY(): number {
    return this.spec.padding + this.spec.logoSize + 12;
  }

  protected parts(data: OrganisationCardData): CompositePart[] {
    const { padding, width, metaRowHeight, metaColor, metaIconColor, stroke } = this.spec;
    const parts: CompositePart[] = [];
    this.logo(data, parts);
    this.identity(data, parts);

    const rows = this.metaRows(data);
    if (rows.length > 0) {
      const divY = this.dividerY();
      parts.push({ part: 'line', x: padding, y: divY, x2: width - padding, y2: divY, stroke: { color: stroke, width: 1 } });
      rows.forEach((r, i) => {
        metaRow(parts, { x: padding, y: divY + 12 + i * metaRowHeight, width: width - padding * 2, icon: r.icon, text: r.text, iconColor: metaIconColor, textColor: metaColor });
      });
    }
    return parts;
  }

  protected frame(data: OrganisationCardData): CardFrame {
    const { width, padding, metaRowHeight, bg, stroke, cornerRadius } = this.spec;
    const rows = this.metaRows(data);
    const height = rows.length > 0 ? this.dividerY() + 12 + rows.length * metaRowHeight + padding - 4 : this.dividerY() + padding - 4;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

/** Shared stock instance backing the {@link organisationCard} convenience fn. */
const DEFAULT = new OrganisationCard();

/** Convenience builder with the stock spec — `new OrganisationCard().build(data)`. */
export function organisationCard(data: OrganisationCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
