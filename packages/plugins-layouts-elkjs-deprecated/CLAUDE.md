> **DEPRECATED.** This package is preserved for reference only during the architecture rewrite (see `architecture-proposal.md` and `migration-storybook-inventory.md` at repo root). New work goes in `packages/canvas`, `packages/graph`, etc.

# CLAUDE.md — packages/plugins-layouts-elkjs (@invana/plugin-layouts-elkjs-deprecated)

ELK.js layout plugin for `@invana/canvas-deprecated`.

- Peer/dev dep on `@invana/canvas-deprecated` (workspace).
- Wraps `elkjs`; exposes a `CanvasPlugin`-compatible interface.
- tsup config: ESM, `external: ['pixi.js', 'elkjs', '@invana/canvas-deprecated']`.
- Single `run()` method — ELK is one-shot (no tick simulation).
- TypeDoc entry point registered in `apps/docs/typedoc.json`.