import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { UserCardData } from './types';

const STATUS_COLOR: Record<NonNullable<UserCardData['status']>, number> = {
  online: 0x22c55e,
  away: 0xf59e0b,
  offline: 0x64748b,
};

/**
 * Build a **profile / user** card — an avatar disc (initials) with a status dot,
 * name + role, a divider, and up to two contact rows (mail / phone) each a
 * Lucide icon + text. A top accent bar (avatar colour) follows the rounded top
 * corners via `clip`.
 */
export function userCard(data: UserCardData): CompositeShapeOption {
  const WIDTH = 250;
  const PAD = 16;
  const AVATAR_R = 22;
  const parts: CompositePart[] = [];

  // Top accent border (avatar colour) — `clip` rounds its top corners.
  parts.push({ part: 'rect', x: 0, y: 0, width: WIDTH, height: 4, fill: data.avatar });

  // Avatar disc + initials.
  const acx = PAD + AVATAR_R;
  const acy = PAD + AVATAR_R;
  parts.push({ part: 'circle', x: acx, y: acy, radius: AVATAR_R, fill: data.avatar });
  parts.push({ part: 'label', x: acx, y: acy - 8, text: data.initials, anchor: 'center', fontSize: 15, fontWeight: 700, fill: 0xffffff });
  if (data.status) {
    parts.push({ part: 'circle', x: acx + 15, y: acy + 15, radius: 7, fill: CARD_BG });
    parts.push({ part: 'circle', x: acx + 15, y: acy + 15, radius: 4.5, fill: STATUS_COLOR[data.status] });
  }

  // Name + role.
  const textX = PAD + AVATAR_R * 2 + 14;
  parts.push({ part: 'label', x: textX, y: PAD + 6, text: data.name, fontSize: 15, fontWeight: 700, fill: 0xf1f5f9, maxWidth: WIDTH - textX - PAD, maxLines: 1, overflow: 'ellipsis' });
  parts.push({ part: 'label', x: textX, y: PAD + 26, text: data.role, fontSize: 12, fill: 0x94a3b8, maxWidth: WIDTH - textX - PAD, maxLines: 1, overflow: 'ellipsis' });

  // Divider.
  const divY = PAD + AVATAR_R * 2 + 8;
  parts.push({ part: 'line', x: PAD, y: divY, x2: WIDTH - PAD, y2: divY, stroke: { color: CARD_STROKE, width: 1 } });

  // Contact rows.
  const rows: Array<{ icon: string; text: string }> = [];
  if (data.email) rows.push({ icon: 'lucide/mail', text: data.email });
  if (data.phone) rows.push({ icon: 'lucide/phone', text: data.phone });
  const ROW_H = 28;
  const startY = divY + 12;
  rows.forEach((r, i) => {
    const y = startY + i * ROW_H;
    parts.push({ part: 'icon', x: PAD, y, size: 16, icon: { kind: 'svg-url', url: iconifyUrl(r.icon), color: 0x94a3b8, strokeWidth: 2 } });
    const tx = PAD + 16 + 10;
    parts.push({ part: 'label', x: tx, y: y + 2, text: r.text, fontSize: 12, fill: 0xcbd5e1, maxWidth: WIDTH - tx - PAD, maxLines: 1, overflow: 'ellipsis' });
  });

  const height = startY + rows.length * ROW_H + PAD - 6;
  return { kind: 'composite', width: WIDTH, height, cornerRadius: 12, fill: CARD_BG, stroke: { color: CARD_STROKE, width: 1 }, parts, clip: true };
}
