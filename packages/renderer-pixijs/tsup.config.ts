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
  external: ['@invana/canvas-core', '@invana/canvas-store'],
  // `pixi-viewport@6` publishes no `exports` map, so Node resolves its `main`
  // (a UMD CommonJS bundle) while bundlers resolve `module` (real ESM). Only the
  // ESM build carries a named `Viewport`, so leaving the specifier bare made this
  // package importable by a bundler and unimportable by Node. Inlining it settles
  // the resolution here, at build time, where there is one right answer — and it
  // is the only option that also fixes published consumers. `pixi.js` stays
  // external: that one must stay a singleton.
  // See docs/rfcs/fix/2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport.md
  noExternal: ['pixi-viewport'],
});
