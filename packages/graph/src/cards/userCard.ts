import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';
import { CompositeCard, type CardFrame } from './base';
import { CARD_BG, CARD_STROKE, iconifyUrl } from './shared';
import type { UserCardData } from './types';

const STATUS_COLOR: Record<NonNullable<UserCardData['status']>, number> = {
  online: 0x22c55e,
  away: 0xf59e0b,
  offline: 0x64748b,
};

/** Full configuration for a {@link UserCard} — edit any field to re-style. */
export interface UserCardSpec {
  width: number;
  padding: number;
  avatarRadius: number;
  contactRowHeight: number;
  cornerRadius: number;
  /** Top accent bar height (0 to hide it). */
  accentHeight: number;
  bg: number;
  stroke: number;
  nameColor: number;
  roleColor: number;
  contactColor: number;
  contactIconColor: number;
}

/** Default {@link UserCardSpec}. */
export const USER_CARD_DEFAULTS: UserCardSpec = {
  width: 250,
  padding: 16,
  avatarRadius: 22,
  contactRowHeight: 28,
  cornerRadius: 12,
  accentHeight: 4,
  bg: CARD_BG,
  stroke: CARD_STROKE,
  nameColor: 0xf1f5f9,
  roleColor: 0x94a3b8,
  contactColor: 0xcbd5e1,
  contactIconColor: 0x94a3b8,
};

/**
 * **Profile / user** card — avatar disc (initials) + status dot, name + role, a
 * divider, and up to two Lucide contact rows. A top accent bar (avatar colour)
 * follows the rounded corners via `clip`. Configured by {@link UserCardSpec};
 * override {@link topAccent} / {@link avatar} / {@link identity} /
 * {@link contacts} for structural changes.
 */
export class UserCard extends CompositeCard<UserCardSpec, UserCardData> {
  constructor(spec: Partial<UserCardSpec> = {}) {
    super({ ...USER_CARD_DEFAULTS, ...spec });
  }

  /** Top accent bar (avatar colour). Set `spec.accentHeight = 0` or override to hide. */
  protected topAccent(data: UserCardData, parts: CompositePart[]): void {
    if (this.spec.accentHeight > 0) parts.push({ part: 'rect', x: 0, y: 0, width: this.spec.width, height: this.spec.accentHeight, fill: data.avatar });
  }

  /** Avatar disc + initials + status dot. */
  protected avatar(data: UserCardData, parts: CompositePart[]): void {
    const { padding, avatarRadius: r, bg } = this.spec;
    const acx = padding + r;
    const acy = padding + r;
    parts.push({ part: 'circle', x: acx, y: acy, radius: r, fill: data.avatar });
    parts.push({ part: 'label', x: acx, y: acy - 8, text: data.initials, anchor: 'center', fontSize: 15, fontWeight: 700, fill: 0xffffff });
    if (data.status) {
      parts.push({ part: 'circle', x: acx + 15, y: acy + 15, radius: 7, fill: bg });
      parts.push({ part: 'circle', x: acx + 15, y: acy + 15, radius: 4.5, fill: STATUS_COLOR[data.status] });
    }
  }

  /** Name + role, beside the avatar. */
  protected identity(data: UserCardData, parts: CompositePart[]): void {
    const { padding, avatarRadius, width, nameColor, roleColor } = this.spec;
    const textX = padding + avatarRadius * 2 + 14;
    parts.push({ part: 'label', x: textX, y: padding + 6, text: data.name, fontSize: 15, fontWeight: 700, fill: nameColor, maxWidth: width - textX - padding, maxLines: 1, overflow: 'ellipsis' });
    parts.push({ part: 'label', x: textX, y: padding + 26, text: data.role, fontSize: 12, fill: roleColor, maxWidth: width - textX - padding, maxLines: 1, overflow: 'ellipsis' });
  }

  /** The contact rows this card renders (mail / phone), in order. */
  protected contactRows(data: UserCardData): Array<{ icon: string; text: string }> {
    const rows: Array<{ icon: string; text: string }> = [];
    if (data.email) rows.push({ icon: 'lucide/mail', text: data.email });
    if (data.phone) rows.push({ icon: 'lucide/phone', text: data.phone });
    return rows;
  }

  /** Y of the divider (below the avatar block). */
  protected dividerY(): number {
    return this.spec.padding + this.spec.avatarRadius * 2 + 8;
  }

  /** Contact rows (icon + text) below the divider. */
  protected contacts(data: UserCardData, parts: CompositePart[]): void {
    const { padding, width, contactRowHeight: RH, contactColor, contactIconColor } = this.spec;
    const startY = this.dividerY() + 12;
    this.contactRows(data).forEach((r, i) => {
      const y = startY + i * RH;
      parts.push({ part: 'icon', x: padding, y, size: 16, icon: { kind: 'svg-url', url: iconifyUrl(r.icon), color: contactIconColor, strokeWidth: 2 } });
      const tx = padding + 16 + 10;
      parts.push({ part: 'label', x: tx, y: y + 2, text: r.text, fontSize: 12, fill: contactColor, maxWidth: width - tx - padding, maxLines: 1, overflow: 'ellipsis' });
    });
  }

  protected parts(data: UserCardData): CompositePart[] {
    const parts: CompositePart[] = [];
    this.topAccent(data, parts);
    this.avatar(data, parts);
    this.identity(data, parts);
    const divY = this.dividerY();
    parts.push({ part: 'line', x: this.spec.padding, y: divY, x2: this.spec.width - this.spec.padding, y2: divY, stroke: { color: this.spec.stroke, width: 1 } });
    this.contacts(data, parts);
    return parts;
  }

  protected frame(data: UserCardData): CardFrame {
    const { width, padding, contactRowHeight, bg, stroke, cornerRadius } = this.spec;
    const height = this.dividerY() + 12 + this.contactRows(data).length * contactRowHeight + padding - 6;
    return { width, height, fill: bg, stroke: { color: stroke, width: 1 }, cornerRadius, clip: true };
  }
}

const DEFAULT = new UserCard();

/** Convenience builder with the stock spec — `new UserCard().build(data)`. */
export function userCard(data: UserCardData): CompositeShapeOption {
  return DEFAULT.build(data);
}
