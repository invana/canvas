/**
 * `straight` router — emits a 2-point polyline `[source, target]`.
 *
 * The simplest router; the default when a connector spec omits `router`.
 */

import type { Router } from '../types';

export const straightRouter: Router = (a, b) => [
  { x: a.x, y: a.y },
  { x: b.x, y: b.y },
];
