import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/canvas-ui`.
 *
 * `node` is enough for what is tested here: pure mapping functions between a
 * template and an editor form (no DOM, no React rendering).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
