import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { StatCardData } from './types';

/**
 * Build a **stat / KPI** tile — a left accent bar, a caption, an accent-tinted
 * icon chip, a large value, and a coloured trend-delta row. The accent bar
 * follows the rounded corners via `clip`.
 */
export function statCard(data: StatCardData): CompositeShapeOption {
  const WIDTH = 210;
  const HEIGHT = 120;
  const PAD = 16;
  const parts: CompositePart[] = [];

  // Left accent bar (clipped to the card corners).
  parts.push({ part: 'rect', x: 0, y: 0, width: 4, height: HEIGHT, fill: data.accent });

  // Caption.
  parts.push({ part: 'label', x: PAD, y: PAD, text: data.label.toUpperCase(), fontSize: 11, fontWeight: 600, fill: 0x94a3b8, maxWidth: WIDTH - PAD * 2 - 40, maxLines: 1, overflow: 'ellipsis' });

  // Icon chip (accent-tinted square + icon), top-right.
  if (data.icon) {
    const chip = 30;
    const chipX = WIDTH - PAD - chip;
    parts.push({ part: 'rect', x: chipX, y: PAD - 4, width: chip, height: chip, cornerRadius: 8, fill: data.accent, fillAlpha: 0.18 });
    parts.push({ part: 'icon', x: chipX, y: PAD - 4, size: chip, icon: { kind: 'svg-url', url: iconifyUrl(data.icon), color: data.accent, strokeWidth: 2, sizeRatio: 0.5 } });
  }

  // Big value.
  parts.push({ part: 'label', x: PAD, y: 48, text: data.value, fontSize: 26, fontWeight: 700, fill: 0xf1f5f9, maxWidth: WIDTH - PAD * 2, maxLines: 1, overflow: 'ellipsis' });

  // Delta row: trend glyph + text.
  if (data.delta) {
    const trendColor = data.trend === 'down' ? 0xf43f5e : 0x22c55e;
    const glyph = data.trend === 'down' ? '▼' : '▲';
    parts.push({ part: 'label', x: PAD, y: HEIGHT - PAD - 6, text: glyph, fontSize: 9, fill: trendColor });
    parts.push({ part: 'label', x: PAD + 14, y: HEIGHT - PAD - 8, text: `${data.delta} vs last month`, fontSize: 12, fontWeight: 600, fill: trendColor, maxWidth: WIDTH - PAD * 2 - 14, maxLines: 1, overflow: 'ellipsis' });
  }

  return { kind: 'composite', width: WIDTH, height: HEIGHT, cornerRadius: 12, fill: CARD_BG, stroke: { color: CARD_STROKE, width: 1 }, parts, clip: true };
}
