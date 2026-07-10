import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { SchemaTableData } from './types';

/** Colour-coded type chip per field type (semantic, like syntax highlight). */
const TYPE_CHIP: Record<string, { char: string; color: number }> = {
  string: { char: 'Abc', color: 0x3b82f6 },
  integer: { char: '123', color: 0x22c55e },
  number: { char: '#', color: 0x22c55e },
  date: { char: '◷', color: 0xf59e0b },
  boolean: { char: '01', color: 0xa855f7 },
};
const chipFor = (t: string) => TYPE_CHIP[t.toLowerCase()] ?? { char: '•', color: 0x64748b };

/** Options for {@link schemaTableCard}. */
export interface SchemaTableCardOptions {
  /** Fixed card width (default 210). */
  width?: number;
  /** Index of the row to highlight — wire from `shape:partover` for per-row hover. */
  hoverRow?: number;
}

/**
 * Build an **ER / schema table** card — a coloured header (optional icon + title)
 * over one row per field (colour-coded type chip + name + data type). The card
 * **auto-sizes** to the field count, and each row is an addressable sub-part
 * (`hitId = row index`) so `shape:partover` / `shape:partcontextmenu` fire per
 * row. `clip` rounds the header's top corners to the card silhouette.
 */
export function schemaTableCard(data: SchemaTableData, opts: SchemaTableCardOptions = {}): CompositeShapeOption {
  const WIDTH = opts.width ?? 210;
  const PAD = 12;
  const RADIUS = 8;
  const HEADER_H = 38;
  const ROW_H = 26;
  const TYPE_W = 64;
  const header = data.header ?? 0x2563eb;
  const active = opts.hoverRow ?? -1;
  const parts: CompositePart[] = [];

  // Header band (a plain rect; `clip` rounds its top corners).
  parts.push({ part: 'rect', x: 0, y: 0, width: WIDTH, height: HEADER_H, fill: header });
  let titleX = PAD;
  if (data.icon) {
    const iconBox = 20;
    parts.push({ part: 'icon', x: PAD, y: (HEADER_H - iconBox) / 2, size: iconBox, icon: { kind: 'svg-url', url: iconifyUrl(data.icon), color: 0xffffff, strokeWidth: 2 } });
    titleX = PAD + iconBox + 8;
  }
  parts.push({ part: 'label', x: titleX, y: (HEADER_H - 14) / 2, text: data.label, fontSize: 14, fontWeight: 700, fill: 0xffffff, maxWidth: WIDTH - titleX - PAD, maxLines: 1, overflow: 'ellipsis' });

  // One row per field.
  data.fields.forEach((f, i) => {
    const rowY = HEADER_H + i * ROW_H;
    parts.push({ part: 'rect', x: 2, y: rowY, width: WIDTH - 4, height: ROW_H, cornerRadius: 4, fill: 0xffffff, fillAlpha: i === active ? 0.13 : 0, hitId: String(i) });

    const chipBox = 16;
    const chipY = rowY + (ROW_H - chipBox) / 2;
    const chip = chipFor(f.type);
    parts.push({ part: 'rect', x: PAD, y: chipY, width: chipBox, height: chipBox, cornerRadius: 3, fill: chip.color });
    parts.push({ part: 'label', x: PAD + chipBox / 2, y: chipY + (chipBox - 8) / 2, text: chip.char, anchor: 'center', fontSize: 8, fontWeight: 700, fill: 0xffffff });

    const nameX = PAD + chipBox + 8;
    parts.push({ part: 'label', x: nameX, y: rowY + (ROW_H - 13) / 2, text: f.name, fontSize: 13, fill: 0xe2e8f0, maxWidth: WIDTH - nameX - PAD - TYPE_W, maxLines: 1, overflow: 'ellipsis' });
    parts.push({ part: 'label', x: WIDTH - PAD, y: rowY + (ROW_H - 11) / 2, text: f.type, anchor: 'right', fontSize: 11, fill: 0x64748b, maxWidth: TYPE_W, maxLines: 1, overflow: 'ellipsis' });
  });

  const height = HEADER_H + data.fields.length * ROW_H + 6;
  return { kind: 'composite', width: WIDTH, height, cornerRadius: RADIUS, fill: CARD_BG, stroke: { color: CARD_STROKE, width: 1 }, parts, clip: true };
}
