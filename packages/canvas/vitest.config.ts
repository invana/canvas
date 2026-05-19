import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for `@invana/canvas`.
 *
 * `happy-dom` provides a `document` / `HTMLCanvasElement` so pixi primitives
 * that touch the DOM (Text bounds, texture-from-canvas, asset loading) work
 * in the test process. It's lighter than `jsdom` and well-suited to pixi's
 * thin DOM dependency.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
});
