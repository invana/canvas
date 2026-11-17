import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/graph-layer-bubble-sets`.
 *
 * `node` is enough: the tested code (`outline.ts`) is pure geometry over
 * `bubblesets-js` with no DOM, canvas or renderer dependency.
 */
export default defineConfig({
  test: {
    environment: 'node',
  },
});
