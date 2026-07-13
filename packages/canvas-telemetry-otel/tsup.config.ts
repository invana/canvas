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
  // Kernel port types + the OpenTelemetry SDK stay external — the consumer dedupes
  // them (one canvas-store, one OTel global provider).
  external: [/^@invana\//, /^@opentelemetry\//],
});
