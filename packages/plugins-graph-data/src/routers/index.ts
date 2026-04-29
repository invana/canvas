// ── routers/index ─────────────────────────────────────────────────────────────
// Built-in router functions for the two-stage connector pipeline.

export { normalRouter } from './NormalRouter.js';
export { orthRouter } from './OrthRouter.js';
export { oneSideRouter } from './OneSideRouter.js';
export { erRouter } from './ErRouter.js';

/** Map of all built-in routers, ready to seed GraphPlugin's registry. */
export { BUILTIN_ROUTERS } from './builtins.js';
