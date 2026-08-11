import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/specs/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  // The default backend is an *optional peer*, resolved by a lazy import at
  // runtime — never bundled, and not required to be installed.
  external: ['@invana/renderer-pixijs'],
});
