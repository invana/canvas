/**
 * The pixi-free drawing vocabulary: descriptions of what to draw, containing no
 * drawing code and importing no rendering library.
 *
 * Consumed by domain packages (`@invana/graph`) and by every renderer backend.
 * See `docs/renderer-split-design.md`.
 */

// `geometry` and `style` carry pure functions as well as types, so they are
// value exports.
export * from './geometry';
export * from './style';
export type * from './plane';
export type * from './label';
export type * from './decoration';
export type * from './shape';
export type * from './connector';
export type * from './hit';
export type * from './stats';

// Spec maths — bounds / scale / collapse / fit / contains, per kind. Pure
// functions, so a value export.
export * from './shapeGeometry';
