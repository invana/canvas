import type { IRouter } from '../../types';

/**
 * Direct line from source to target, bypassing any waypoints.
 * Output: `[M source, L target]` — two commands, one straight segment.
 */
export const straightRouter: IRouter = (source, target) => [
  { kind: 'M', x: source.x, y: source.y },
  { kind: 'L', x: target.x, y: target.y },
];
