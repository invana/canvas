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
  // The default backend is a required dependency, imported at module scope by
  // `Canvas`. It stays external (tsup would do this anyway for a `dependency`)
  // so consumers resolve one copy of it rather than getting it inlined here.
  external: ['@invana/renderer-pixijs'],
});
