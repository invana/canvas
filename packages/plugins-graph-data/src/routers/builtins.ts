// ── BUILTIN_ROUTERS ───────────────────────────────────────────────────────────
// Seed map for GraphPlugin's router registry.

import type { RouterFn } from '../spec/index.js';
import { normalRouter } from './NormalRouter.js';
import { orthRouter } from './OrthRouter.js';
import { oneSideRouter } from './OneSideRouter.js';
import { erRouter } from './ErRouter.js';

/**
 * All built-in routers keyed by their public name.
 * Seeded into {@link _GraphPlugin._routerRegistry} on construction.
 */
export const BUILTIN_ROUTERS: Map<string, RouterFn> = new Map([
  ['normal',  normalRouter],
  ['orth',    orthRouter],
  ['oneSide', oneSideRouter],
  ['er',      erRouter],
]);
