# CLAUDE.md — packages/layouts-d3-force (@invana/layouts-d3-force)

D3 force-directed layout plugin for `@invana/canvas`. Future publish name: `@invana/plugin-layout-force`.

- Peer/dev dep on `@invana/canvas` (workspace).
- Wraps `d3-force`; exposes a `CanvasPlugin`-compatible interface.
- tsup config: ESM, `external: ['pixi.js', 'd3-force', '@invana/canvas']`.
- TypeDoc entry point registered in `apps/ts-doc/typedoc.json`.
