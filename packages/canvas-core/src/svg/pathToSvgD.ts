/**
 * `Path` → SVG path-data serialisation. Pure: a routed {@link Path} in, a `d`
 * attribute string out.
 */

import type { Path } from '@invana/canvas-store';
import { n } from './markup';

/** A `Path` (M/L/Q/C commands) → an SVG `d` attribute string. */
export function pathToSvgD(path: Path): string {
  const out: string[] = [];
  for (const c of path) {
    if (c.kind === 'M') out.push(`M ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === 'L') out.push(`L ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === 'Q') out.push(`Q ${n(c.cx)} ${n(c.cy)} ${n(c.x)} ${n(c.y)}`);
    else out.push(`C ${n(c.c1x)} ${n(c.c1y)} ${n(c.c2x)} ${n(c.c2y)} ${n(c.x)} ${n(c.y)}`);
  }
  return out.join(' ');
}
