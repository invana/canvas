import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/renderer-pixijs`.
 *
 * `node` environment: the tests here cover the backend's pure decision logic
 * (paint order → pick order), which needs pixi's scene-graph classes but no
 * GPU, canvas or DOM. Anything that needs a real `Application` belongs in a
 * Storybook smoke test, not here.
 */
export default defineConfig({
  test: {
    environment: 'node',
  },
});
