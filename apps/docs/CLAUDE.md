# CLAUDE.md — apps/docs (`@canvas/docs`)

VitePress site + TypeDoc-generated API reference for the new architecture.

**Status:** skeleton — homepage + getting-started placeholder only.

## Commands

```bash
pnpm --filter @canvas/docs dev       # http://localhost:5173
pnpm --filter @canvas/docs build     # typedoc + vitepress build
pnpm --filter @canvas/docs preview
```

## TypeDoc

`typedoc.json` points at the five new packages' `src/index.ts` entry points. Output goes to `./api/` (gitignored), then VitePress sidebar auto-detects the generated files via `.vitepress/config.ts`.
