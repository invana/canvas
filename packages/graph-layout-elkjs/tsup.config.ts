import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['pixi.js', 'elkjs', '@invana/canvas', '@invana/graph'],
  // The default `workerFactory` loads `./elk-worker.min.js` relative to the
  // bundle, so elkjs's classic worker script ships beside it.
  onSuccess: async () => {
    copyFileSync(require.resolve('elkjs/lib/elk-worker.min.js'), 'dist/elk-worker.min.js');
  },
});
