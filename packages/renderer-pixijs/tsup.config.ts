import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  // The engine and kernel are peers; pixi is this package's whole reason to exist
  // and is bundled as a normal dependency for consumers that install it.
  external: ['@invana/canvas', '@invana/canvas-store'],
});
