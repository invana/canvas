/**
 * SVG markup primitives — number formatting, XML escaping, attribute
 * serialisation and colour conversion shared by every serialiser in this
 * folder (and by the `exportSVG` document assembler in `@invana/canvas`).
 *
 * Pure string helpers: no DOM, no canvas, no backend.
 */

import type { Point } from '../../specs';

/** Round to 3 decimals and drop a trailing `.0` — keeps the markup compact. */
export function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, '');
}

/** Escape text for use in an XML text node / attribute value. */
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

/** Serialise an attribute map, skipping `undefined` / empty values. */
export function attrs(map: Record<string, string | number | undefined>): string {
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${typeof v === 'number' ? n(v) : v}"`)
    .join(' ');
}

/** `points="x,y x,y …"` for `<polygon>`. */
export function pointsAttr(pts: readonly Point[]): string {
  return pts.map((p) => `${n(p.x)},${n(p.y)}`).join(' ');
}

/** `0xRRGGBB` → `#rrggbb`. */
export function hexToCss(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}
