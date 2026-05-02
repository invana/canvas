> **DEPRECATED.** This package is preserved for reference only during the architecture rewrite (see `architecture-proposal.md` and `migration-storybook-inventory.md` at repo root). New work goes in `packages/canvas`, `packages/graph`, etc.

# CLAUDE.md — packages/plugins-layouts-d3-force (@invana/plugin-layouts-d3-force-deprecated)

D3 force-directed layout plugin for `@invana/canvas-deprecated`.

- Peer/dev dep on `@invana/canvas-deprecated` (workspace).
- Wraps `d3-force`; exposes a `CanvasPlugin`-compatible interface.
- tsup config: ESM, `external: ['pixi.js', 'd3-force', '@invana/canvas-deprecated']`.
- TypeDoc entry point registered in `apps/docs/typedoc.json`.