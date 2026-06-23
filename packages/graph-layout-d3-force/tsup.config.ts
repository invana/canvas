import { defineConfig } from 'tsup';

export default defineConfig({
  // The worker is a second entry so it lands at `dist/forceSolver.worker.js`,
  // which the default `workerFactory` references via `new URL(...)`.
  entry: ['src/index.ts', 'src/forceSolver.worker.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['pixi.js', 'd3-force', '@invana/canvas', '@invana/graph'],
});
