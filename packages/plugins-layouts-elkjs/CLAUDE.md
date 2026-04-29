# CLAUDE.md — packages/plugins-layouts-elkjs (@invana/plugin-layouts-elkjs)

ELK.js layout plugin for `@invana/canvas`.

- Peer/dev dep on `@invana/canvas` (workspace).
- Wraps `elkjs`; exposes a `CanvasPlugin`-compatible interface.
- tsup config: ESM, `external: ['pixi.js', 'elkjs', '@invana/canvas']`.
- Single `run()` method — ELK is one-shot (no tick simulation).
- TypeDoc entry point registered in `apps/docs/typedoc.json`.
