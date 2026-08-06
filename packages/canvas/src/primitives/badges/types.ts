/**
 * Badge types moved to the pixi-free spec vocabulary (`specs/badge.ts`) so
 * domain packages can describe badges without importing a drawing backend.
 * Re-exported here so existing importers keep working.
 */
export type * from '../../specs/badge';
