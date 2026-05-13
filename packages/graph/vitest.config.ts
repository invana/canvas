import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/graph`.
 *
 * `node` environment is sufficient — the store is pure JS with no DOM
 * dependency. Layer/behaviour tests that arrive later may switch to
 * `happy-dom` to mirror `@invana/canvas`.
 */
export default defineConfig({
  test: {
    environment: 'node',
  },
});
