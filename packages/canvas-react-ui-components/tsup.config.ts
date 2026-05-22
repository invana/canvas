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
  external: [
    'react',
    'react-dom',
    'pixi.js',
    '@invana/canvas',
    '@invana/canvas-react',
    '@invana/graph',
    '@invana/ui',
    '@invana/themes',
  ],
});
