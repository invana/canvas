import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, chip, iconifyUrl } from './shared';
import type { IDCardData } from './types';

/** Pill colour per badge status. */
const STATUS_COLOR: Record<NonNullable<IDCardData['status']>, number> = {
  active: 0x22c55e,
  expired: 0xf43f5e,
  suspended: 0xf59e0b,
};

/** Pill copy per badge status. */
const STATUS_LABEL: Record<NonNullable<IDCardData['status']>, string> = {
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
};

/** Full configuration for an {@link IDCard} — edit any field to re-style. */
export interface IDCardSpec {
  width: number;
  height: number;
  padding: number;
  cornerRadius: number;
  /** Accent header band height (0 to hide it, and the `org` line with it). */
  headerHeight: number;
  /** Side of the square photo chip. */
  photoSize: number;
  /** Corner radius of the photo chip. */
  photoRadius: number;
  bg: number;
  stroke: number;
  orgColor: number;
  nameColor: number;
  titleColor: number;
  idColor: number;
  validColor: number;
}

/** Default {@link IDCardSpec}. */
export const ID_CARD_DEFAULTS: IDCardSpec = {
  width: 240,
  height: 148,
  padding: 14,
  cornerRadius: 12,
  headerHeight: 26,
  photoSize: 52,
  photoRadius: 8,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  orgColor: 0xffffff,
  nameColor: 0xf1f5f9,
  titleColor: 0x94a3b8,
  idColor: 0xcbd5e1,
  validColor: 0x64748b,
};

/**
 * **Identity / access badge** card — an accent header band carrying the issuing
 * organisation, a photo chip (icon, or initials when there's no photo) beside
 * the holder's name + title, a divider, then the badge number and a status
 * pill. The header follows the rounded corners via `clip`.
 *
 * Distinct from the `idCard` **structure template** in
 * `src/template/structures.ts`: that one is a row/slot `CardStructure` compiled
 * by `compileCard`, this is a {@link CompositeCard} subclass that builds the
 * composite spec directly. Same name, two layers of the same stack.
 *
 * Configured by {@link IDCardSpec}; override {@link header} / {@link photo} /
 * {@link identity} / {@link footer} for structural changes.
 */
export class IDCard extends CompositeCard<IDCardSpec, IDCardData> {
  constructor(spec: Partial<IDCardSpec> = {}) {
    super({ ...ID_CARD_DEFAULTS, ...spec });
  }

  /** Accent header band + the issuing organisation. */
  protected header(data: IDCardData, parts: CompositePart[]): void {
    const { width, headerHeight: H, padding, orgColor } = this.spec;
    if (H <= 0) return;
    parts.push({ part: 'rect', x: 0, y: 0, width, height: H, fill: data.accent });
    if (data.org) parts.push({ part: 'label', x: padding, y: (H - 10) / 2, text: data.org.toUpperCase(), fontSize: 10, fontWeight: 700, fill: orgColor, maxWidth: width - padding * 2, maxLines: 1, overflow: 'ellipsis' });
  }

  /** Photo chip — the `photo` icon, or `initials` on an accent-tinted square. */
  protected photo(data: IDCardData, parts: CompositePart[]): void {
    const { padding, headerHeight, photoSize: S, photoRadius } = this.spec;
    const y = headerHeight + padding;
    parts.push({ part: 'rect', x: padding, y, width: S, height: S, cornerRadius: photoRadius, fill: data.accent, fillAlpha: 0.22 });
    if (data.photo) {
      parts.push({ part: 'icon', x: padding, y, size: S, icon: { kind: 'svg-url', url: iconifyUrl(data.photo), color: data.accent, strokeWidth: 2, sizeRatio: 0.55 } });
    } else if (data.initials) {
      parts.push({ part: 'label', x: padding + S / 2, y: y + (S - 18) / 2, text: data.initials, anchor: 'center', fontSize: 18, fontWeight: 700, fill: data.accent });
    }
  }

  /** Name + title, beside the photo chip. */
  protected identity(data: IDCardData, parts: CompositePart[]): void {
    const { padding, headerHeight, photoSize, width, nameColor, titleColor } = this.spec;
    const x = padding + photoSize + 12;
    const y = headerHeight + padding;
    const maxWidth = width - x - padding;
    parts.push({ part: 'label', x, y: y + 6, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth, maxLines: 1, overflow: 'ellipsis' });
    if (data.title) parts.push({ part: 'label', x, y: y + 26, text: data.title, fontSize: 12, fill: titleColor, maxWidth, maxLines: 2, overflow: 'ellipsis', lineHeight: 15 });
  }

  /** Y of the divider, below the photo block. */
  protected dividerY(): number {
    return this.spec.headerHeight + this.spec.padding + this.spec.photoSize + 12;
  }

  /** Badge number (left) + status pill and validity note (right). */
  protected footer(data: IDCardData, parts: CompositePart[]): void {
    const { padding, width, idColor, validColor } = this.spec;
    const y = this.dividerY() + 12;
    let right = width - padding;
    if (data.status) {
      const text = STATUS_LABEL[data.status];
      const w = text.length * 6.5 + 16;
      chip(parts, { x: right - w, y, text, color: STATUS_COLOR[data.status] });
      right -= w + 8;
    }
    parts.push({ part: 'label', x: padding, y: y + 3, text: data.idNumber, fontSize: 12, fontWeight: 600, fill: idColor, maxWidth: right - padding - 6, maxLines: 1, overflow: 'ellipsis' });
    if (data.validUntil) parts.push({ part: 'label', x: padding, y: y + 20, text: data.validUntil, fontSize: 10, fill: validColor, maxWidth: width - padding * 2, maxLines: 1, overflow: 'ellipsis' });
  }

  protected parts(data: IDCardData): CompositePart[] {
    const parts: CompositePart[] = [];
    this.header(data, parts);
    this.photo(data, parts);
    this.identity(data, parts);
    const divY = this.dividerY();
    parts.push({ part: 'line', x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.footer(data, parts);
    return parts;
  }

  protected frame(): CardFrame {
    const { width, height, bg, stroke, cornerRadius } = this.spec;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

/** Shared stock instance backing the {@link idCard} convenience fn. */
const DEFAULT = new IDCard();

/** Convenience builder with the stock spec — `new IDCard().build(data)`. */
export function idCard(data: IDCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
