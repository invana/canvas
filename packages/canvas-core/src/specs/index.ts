/**
 * The drawing-library-free **drawing vocabulary**: descriptions of what to draw,
 * containing no drawing code and importing no rendering library.
 *
 * Consumed by domain packages (`@invana/graph`), by every renderer backend, and —
 * since the vocabulary moved down into the kernel — by `SpecStore`, which holds
 * these specs as state. `@invana/canvas` re-exports the whole surface, so engine
 * and domain code may keep importing it from there.
 *
 * See `docs/renderer-split-design.md`.
 */

// `geometry` and `style` carry pure functions as well as types, so they are
// value exports.
export * from './geometry';
export * from './style';
export type * from './plane';
export type * from './label';
export type * from './decoration';
export type * from './decorationStyle';
export type * from './badge';
export type * from './shape';
export type * from './connector';
export type * from './hit';
export type * from './stats';

// Spec maths — bounds / scale / collapse / fit / contains, per kind. Pure
// functions, so a value export.
export * from './shapeGeometry';
export * from './elementEvents';

// The store that holds specs as durable state. It sits beside the vocabulary it
// stores rather than above it.
export { SpecStore, type SpecFlush } from './SpecStore';
