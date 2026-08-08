/**
 * Badge placement maths — where a badge sits relative to its host.
 *
 * Pure geometry over a host `Rect` (shapes) or routed `Path` (connectors); the
 * badge itself is an ordinary shape the renderer draws. Engine-side after the
 * P6 split, since placement is a geometry answer and must not need a backend.
 */

export { resolveBadgePosition, originToBadgeLocal } from './placement';
export { resolveConnectorBadgePosition } from './connectorPlacement';
export type * from './types';
