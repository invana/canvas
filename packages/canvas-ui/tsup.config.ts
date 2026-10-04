import { defineConfig } from 'tsup';

export default defineConfig({
  // `boards` is its own entry (`@invana/canvas-ui/boards`) so the main bundle
  // never imports the optional `@invana/boards` peer.
  entry: { index: 'src/index.ts', boards: 'src/boards/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // On, so modules shared by the two entries (GraphCanvasApp's React contexts
  // among them) land in one shared chunk instead of being copied into each.
  splitting: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    'react-hook-form',
    '@invana/boards',
    '@invana/canvas',
    '@invana/canvas-react',
    '@invana/graph',
    '@invana/ui',
    '@invana/themes',
    '@invana/styling',
    '@invana/forms',
  ],
});
