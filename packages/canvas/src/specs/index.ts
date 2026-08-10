/**
 * `@invana/canvas/specs` — the spec vocabulary, re-exported.
 *
 * **The vocabulary itself lives in `@invana/canvas-store`.** It moved down into
 * the kernel so the engine could shed its last third-party dependency; specs are
 * plain data describing what to draw, and the store that holds them
 * (`SpecStore`), the geometry over them, and the picking index that hit-tests
 * them now sit together.
 *
 * This module exists so the published `@invana/canvas/specs` subpath keeps
 * resolving for consumers that import from it. New code inside this repo should
 * import from `@invana/canvas-store` (or from the `@invana/canvas` root, which
 * re-exports the same surface) rather than deepening its reliance on this path.
 *
 * See `docs/rfcs/fix/2026-08-10-zustand-imported-outside-canvas-store.md`.
 */

export * from '@invana/canvas-store/specs';
