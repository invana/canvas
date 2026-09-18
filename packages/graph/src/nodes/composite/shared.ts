/**
 * Shared bits for the built-in composite **card** node types — colours + a
 * couple of helpers reused across the composite node types in this folder.
 * These builders produce a {@link CompositeShapeOption} from data;
 * consumers wire them via a per-node `shape` resolver:
 *
 * ```ts
 * new GraphLayer({ options: { node: { style: {
 *   shape: (n) => userCard(n.data as UserCardData),
 *   bgStrokeWidth: 0,
 * }}}})
 * ```
 *
 * Colours are dark-theme defaults baked in (matching the story look); the card
 * body / stroke can be overridden per builder, and data-driven accents come
 * from the data. Theme-role colouring is a later enhancement.
 */

import type { CompositePart } from '@invana/canvas';

/** iconify CDN URL for an icon id like `lucide/users` (used by the `icon` parts). */
export const iconifyUrl = (id: string): string => `https://api.iconify.design/${id}.svg`;

/** Default card body fill (slate-900). */
export const CARD_BG = 0x0f172a;
/** Default card border (slate-700). */
export const CARD_STROKE = 0x334155;

// ─── Shared part builders ───────────────────────────────────────────────────

/** Geometry + copy for one {@link metaRow} — a Lucide icon beside a line of text. */
export interface MetaRowOptions {
  /** Left edge of the icon box. */
  x: number;
  /** Top of the row. */
  y: number;
  /** Width available to the row; the label ellipsises to fit what's left. */
  width: number;
  /** Iconify id, e.g. `lucide/map-pin`. */
  icon: string;
  text: string;
  iconColor: number;
  textColor: number;
  /** Side of the icon box. Default `14`. */
  iconSize?: number;
  /** Default `12`. */
  fontSize?: number;
  /** Space between icon and text. Default `8`. */
  gap?: number;
}

/**
 * Push an **icon + text meta row** — the `lucide/map-pin` + location pattern
 * shared by the organisation, event and user cards. The label ellipsises into
 * whatever `width` leaves after the icon and gap.
 */
export function metaRow(parts: CompositePart[], o: MetaRowOptions): void {
  const size = o.iconSize ?? 14;
  const gap = o.gap ?? 8;
  const fontSize = o.fontSize ?? 12;
  parts.push({ part: 'icon', x: o.x, y: o.y, size, icon: { kind: 'svg-url', url: iconifyUrl(o.icon), color: o.iconColor, strokeWidth: 2 } });
  const tx = o.x + size + gap;
  parts.push({ part: 'label', x: tx, y: o.y + (size - fontSize) / 2, text: o.text, fontSize, fill: o.textColor, maxWidth: o.x + o.width - tx, maxLines: 1, overflow: 'ellipsis' });
}

/** Geometry + copy for one {@link chip} — a rounded, tinted pill. */
export interface ChipOptions {
  x: number;
  y: number;
  text: string;
  /** Drives both the tinted background and the label. */
  color: number;
  /** Default `18`. */
  height?: number;
  /** Default `11`. */
  fontSize?: number;
  /** Background tint alpha. Default `0.2`. */
  alpha?: number;
}

/**
 * Push a **rounded pill chip** (tinted rect + centred label) and return its
 * width, so a caller can lay chips out left → right. Width is estimated from
 * the character count — the renderer measures text, this does not.
 */
export function chip(parts: CompositePart[], o: ChipOptions): number {
  const h = o.height ?? 18;
  const fontSize = o.fontSize ?? 11;
  const w = o.text.length * (fontSize * 0.59) + 16;
  parts.push({ part: 'rect', x: o.x, y: o.y, width: w, height: h, cornerRadius: h / 2, fill: o.color, fillAlpha: o.alpha ?? 0.2 });
  parts.push({ part: 'label', x: o.x + w / 2, y: o.y + (h - fontSize) / 2, text: o.text, anchor: 'center', fontSize, fontWeight: 600, fill: o.color });
  return w;
}
