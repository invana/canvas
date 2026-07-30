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
    '@invana/graph',
    '@invana/graph-layout-d3-force',
    // Optional peers behind the overlay-layer / layout wrappers — kept external
    // so a consumer that never renders them doesn't need them installed.
    '@invana/graph-layout-elkjs',
    '@invana/graph-layout-d3-sankey',
    '@invana/graph-layer-d3-contour',
    '@invana/graph-layer-maplibre',
    'maplibre-gl',
  ],
});
