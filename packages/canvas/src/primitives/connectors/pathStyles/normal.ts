import type { IPathStyle, PathCommand } from '../../types';

/**
 * Sharp segments. Walks the polyline emitting `M` then `L L L …`.
 *
 * For a 2-point polyline, this is `[M source, L target]` — equivalent to
 * the straight-line baseline. For an N-point polyline (router-produced
 * bends), this draws straight segments between every consecutive pair with
 * no corner treatment.
 */
export const normalPathStyle: IPathStyle = (polyline) => {
  if (polyline.length < 2) return [];
  const out: PathCommand[] = [{ kind: 'M', x: polyline[0]!.x, y: polyline[0]!.y }];
  for (let i = 1; i < polyline.length; i++) {
    out.push({ kind: 'L', x: polyline[i]!.x, y: polyline[i]!.y });
  }
  return out;
};
