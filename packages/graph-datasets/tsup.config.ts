import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/usecase-demos/index.ts',
    'src/game-of-thrones/index.ts',
    'src/wikipedia-dataviz/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
});
