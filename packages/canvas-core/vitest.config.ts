import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/canvas-core`.
 *
 * Everything here is renderer-free and DOM-free (contracts, abstracts, camera
 * semantics, geometry, the headless double), so the default node environment
 * suffices — no DOM shim needed.
 */
export default defineConfig({
  test: {},
});
