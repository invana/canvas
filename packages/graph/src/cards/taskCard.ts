import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { TaskCardData } from './types';

const PRIORITY_COLOR: Record<TaskCardData['priority'], number> = { high: 0xf43f5e, med: 0xf59e0b, low: 0x64748b };
const PRIORITY_LABEL: Record<TaskCardData['priority'], string> = { high: 'High', med: 'Medium', low: 'Low' };

/** A rounded pill chip: tinted rect + centred label. Returns its width. */
function pill(parts: CompositePart[], x: number, y: number, text: string, color: number): number {
  const w = text.length * 6.5 + 16;
  parts.push({ part: 'rect', x, y, width: w, height: 18, cornerRadius: 9, fill: color, fillAlpha: 0.2 });
  parts.push({ part: 'label', x: x + w / 2, y: y + 4, text, anchor: 'center', fontSize: 11, fontWeight: 600, fill: color });
  return w;
}

/**
 * Build a **Kanban task** card — a wrapped title, a priority pill + coloured tag
 * chips, a divider, and a footer (assignee avatar + due date). A bottom accent
 * bar (priority colour) follows the rounded bottom corners via `clip`.
 */
export function taskCard(data: TaskCardData): CompositeShapeOption {
  const WIDTH = 230;
  const HEIGHT = 130;
  const PAD = 14;
  const parts: CompositePart[] = [];

  const pColor = PRIORITY_COLOR[data.priority];
  const pText = PRIORITY_LABEL[data.priority];
  const pw = pText.length * 6.5 + 16;

  // Bottom accent border (priority colour), clipped to the bottom corners.
  parts.push({ part: 'rect', x: 0, y: HEIGHT - 4, width: WIDTH, height: 4, fill: pColor });

  // Priority pill (top-right).
  pill(parts, WIDTH - PAD - pw, PAD, pText, pColor);

  // Title — wraps up to 2 lines, leaving room for the pill on line 1.
  parts.push({ part: 'label', x: PAD, y: PAD, text: data.title, fontSize: 14, fontWeight: 700, fill: 0xf1f5f9, maxWidth: WIDTH - PAD * 2 - pw - 8, maxLines: 2, overflow: 'ellipsis', lineHeight: 18 });

  // Tag chips.
  let tx = PAD;
  const tagsY = PAD + 44;
  for (const tag of data.tags ?? []) tx += pill(parts, tx, tagsY, tag.label, tag.color) + 6;

  // Divider.
  const divY = tagsY + 26;
  parts.push({ part: 'line', x: PAD, y: divY, x2: WIDTH - PAD, y2: divY, stroke: { color: CARD_STROKE, width: 1 } });

  // Footer: assignee avatar (left) + due date (right).
  const footY = divY + 12;
  if (data.assignee) {
    parts.push({ part: 'circle', x: PAD + 12, y: footY + 10, radius: 12, fill: data.assignee.color });
    parts.push({ part: 'label', x: PAD + 12, y: footY + 3, text: data.assignee.initials, anchor: 'center', fontSize: 10, fontWeight: 700, fill: 0xffffff });
  }
  if (data.due) {
    parts.push({ part: 'icon', x: WIDTH - PAD - 78, y: footY + 4, size: 14, icon: { kind: 'svg-url', url: iconifyUrl('lucide/calendar'), color: 0x94a3b8, strokeWidth: 2 } });
    parts.push({ part: 'label', x: WIDTH - PAD, y: footY + 5, text: data.due, anchor: 'right', fontSize: 11, fill: 0x94a3b8, maxWidth: 58, maxLines: 1, overflow: 'ellipsis' });
  }

  return { kind: 'composite', width: WIDTH, height: HEIGHT, cornerRadius: 12, fill: CARD_BG, stroke: { color: CARD_STROKE, width: 1 }, parts, clip: true };
}
