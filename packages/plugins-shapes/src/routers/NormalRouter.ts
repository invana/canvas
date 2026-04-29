// ── NormalRouter ──────────────────────────────────────────────────────────────

import type { RouterFn } from '../spec/index.js';

/** Normal (pass-through) router — returns vertices unchanged. */
export const normalRouter: RouterFn = (_from, _to, vertices) => vertices;
