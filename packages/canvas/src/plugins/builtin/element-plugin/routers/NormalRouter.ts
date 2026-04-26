// ── NormalRouter ──────────────────────────────────────────────────────────────
// Pass-through router — returns the user-supplied vertices unchanged.

import type { RouterFn } from '../spec/index.js';

/**
 * Normal (pass-through) router.
 * Returns the provided vertices without modification.
 * This is the default behaviour when no `router` is specified on a connector.
 */
export const normalRouter: RouterFn = (_from, _to, vertices) => vertices;
