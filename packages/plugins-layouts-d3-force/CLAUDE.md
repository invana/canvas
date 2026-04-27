# CLAUDE.md — packages/plugins-layouts-d3-force (@invana/plugin-layouts-d3-force)

D3 force-directed layout plugin for `@invana/canvas`.

- Peer/dev dep on `@invana/canvas` (workspace).
- Wraps `d3-force`; exposes a `CanvasPlugin`-compatible interface.
- tsup config: ESM, `external: ['pixi.js', 'd3-force', '@invana/canvas']`.
- TypeDoc entry point registered in `apps/docs/typedoc.json`.
