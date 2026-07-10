import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { SchemaTableData } from './types';

/** Full configuration for a {@link SchemaTableCard} — edit any field to re-style. */
export interface SchemaTableCardSpec {
  width: number;
  headerHeight: number;
  rowHeight: number;
  cornerRadius: number;
  padding: number;
  /** Reserved width for the right-aligned data-type column. */
  typeColWidth: number;
  bg: number;
  stroke: number;
  /** Header colour used when a node's `data.header` is unset. */
  headerColor: number;
  titleColor: number;
  nameColor: number;
  typeColor: number;
  /** Row highlight colour + alpha (per-row hover band). */
  rowHoverColor: number;
  rowHoverAlpha: number;
}

/** Default {@link SchemaTableCardSpec}. */
export const SCHEMA_TABLE_CARD_DEFAULTS: SchemaTableCardSpec = {
  width: 210,
  headerHeight: 38,
  rowHeight: 26,
  cornerRadius: 8,
  padding: 12,
  typeColWidth: 64,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  headerColor: 0x2563eb,
  titleColor: 0xffffff,
  nameColor: 0xe2e8f0,
  typeColor: 0x64748b,
  rowHoverColor: 0xffffff,
  rowHoverAlpha: 0.13,
};

/** Options for {@link SchemaTableCard.build}. */
export interface SchemaTableCardOptions {
  /** Index of the row to highlight — wire from `shape:partover` for per-row hover. */
  hoverRow?: number;
}

/**
 * **ER / schema table** card — a coloured header (optional icon + title) over
 * one row per field (colour-coded type chip + name + data type). Auto-sizes to
 * the field count; each row is an addressable sub-part (`hitId = row index`).
 * Fully configured by {@link SchemaTableCardSpec}; override {@link typeChip} /
 * {@link header} / {@link row} for structural changes.
 */
export class SchemaTableCard extends CompositeCard<SchemaTableCardSpec, SchemaTableData, SchemaTableCardOptions> {
  constructor(spec: Partial<SchemaTableCardSpec> = {}) {
    super({ ...SCHEMA_TABLE_CARD_DEFAULTS, ...spec });
  }

  /** Colour-coded chip glyph + colour for a field's data type. Override to remap. */
  protected typeChip(type: string): { char: string; color: number } {
    switch (type.toLowerCase()) {
      case 'string':
      case 'text':
      case 'varchar':
      case 'uuid':
        return { char: 'Abc', color: 0x3b82f6 };
      case 'number':
      case 'float':
        return { char: '#', color: 0x22c55e };
      case 'integer':
      case 'int':
        return { char: '123', color: 0x22c55e };
      case 'date':
      case 'datetime':
      case 'timestamp':
        return { char: '◷', color: 0xf59e0b };
      case 'boolean':
      case 'bool':
        return { char: '01', color: 0xa855f7 };
      default:
        return { char: '•', color: 0x64748b };
    }
  }

  /** Header band (icon + title). */
  protected header(data: SchemaTableData, parts: CompositePart[]): void {
    const { width, headerHeight: H, padding: PAD, titleColor } = this.spec;
    parts.push({ part: 'rect', x: 0, y: 0, width, height: H, fill: data.header ?? this.spec.headerColor });
    let titleX = PAD;
    if (data.icon) {
      const box = 20;
      parts.push({ part: 'icon', x: PAD, y: (H - box) / 2, size: box, icon: { kind: 'svg-url', url: iconifyUrl(data.icon), color: titleColor, strokeWidth: 2 } });
      titleX = PAD + box + 8;
    }
    parts.push({ part: 'label', x: titleX, y: (H - 14) / 2, text: data.label, fontSize: 14, fontWeight: 700, fill: titleColor, maxWidth: width - titleX - PAD, maxLines: 1, overflow: 'ellipsis' });
  }

  /** One field row (chip + name + type). */
  protected row(field: { name: string; type: string }, index: number, active: boolean, parts: CompositePart[]): void {
    const { width: W, padding: PAD, rowHeight: RH, headerHeight, typeColWidth, nameColor, typeColor, rowHoverColor, rowHoverAlpha } = this.spec;
    const rowY = headerHeight + index * RH;
    parts.push({ part: 'rect', x: 2, y: rowY, width: W - 4, height: RH, cornerRadius: 4, fill: rowHoverColor, fillAlpha: active ? rowHoverAlpha : 0, hitId: String(index) });

    const chipBox = 16;
    const chipY = rowY + (RH - chipBox) / 2;
    const chip = this.typeChip(field.type);
    parts.push({ part: 'rect', x: PAD, y: chipY, width: chipBox, height: chipBox, cornerRadius: 3, fill: chip.color });
    parts.push({ part: 'label', x: PAD + chipBox / 2, y: chipY + (chipBox - 8) / 2, text: chip.char, anchor: 'center', fontSize: 8, fontWeight: 700, fill: 0xffffff });

    const nameX = PAD + chipBox + 8;
    parts.push({ part: 'label', x: nameX, y: rowY + (RH - 13) / 2, text: field.name, fontSize: 13, fill: nameColor, maxWidth: W - nameX - PAD - typeColWidth, maxLines: 1, overflow: 'ellipsis' });
    parts.push({ part: 'label', x: W - PAD, y: rowY + (RH - 11) / 2, text: field.type, anchor: 'right', fontSize: 11, fill: typeColor, maxWidth: typeColWidth, maxLines: 1, overflow: 'ellipsis' });
  }

  protected parts(data: SchemaTableData, opts: SchemaTableCardOptions): CompositePart[] {
    const parts: CompositePart[] = [];
    const active = opts.hoverRow ?? -1;
    this.header(data, parts);
    data.fields.forEach((f, i) => this.row(f, i, i === active, parts));
    return parts;
  }

  protected frame(data: SchemaTableData): CardFrame {
    const { width, headerHeight, rowHeight, bg, stroke, cornerRadius } = this.spec;
    return {
      width,
      height: headerHeight + data.fields.length * rowHeight + 6,
      fill: bg,
      stroke: { color: stroke, width: 1 },
      cornerRadius,
      clip: true,
    };
  }
}

/** Shared stock instance backing the {@link schemaTableCard} convenience fn. */
const DEFAULT = new SchemaTableCard();

/** Convenience builder with the stock spec — `new SchemaTableCard().build(data, opts)`. */
export function schemaTableCard(data: SchemaTableData, opts?: SchemaTableCardOptions): CompositeShapeOption {
  return DEFAULT.build(data, opts);
}
