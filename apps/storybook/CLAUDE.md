# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. Rebuilt fresh as part of the architecture rewrite.

**Status:** skeleton — only a Welcome page so far. Stories to port are listed in `migration-storybook-inventory.md` at repo root; that file is the authoritative checklist.

## Conventions

- Stories live under `stories/<area>/...` mirroring the new structure proposed in the inventory:
  - `stories/Renderer/...`  ← primitive renderer demos
  - `stories/Layers/...`                  ← `BackgroundLayer`, `MiniMapLayer`, `ThemedBackgroundLayer`, `DevInfoLayer`
  - `stories/Behaviours/...`              ← `HoverActivate`, `ClickSelect`, `LassoSelect`, etc.
  - `stories/Layouts/...`                 ← `D3ForceLayout`, `ElkLayout`
  - `stories/Layer/Graph/...`             ← `GraphLayer`-specific stories
  - `stories/Showcase/...`                ← end-to-end demos
- Story files: `<Name>.stories.ts`. Title format: `'<Area>/<Subarea>'`.
- No raw `pixi.js` imports inside stories — go through `@invana/canvas` / `@invana/graph` API.

## Run

```bash
pnpm --filter @canvas/storybook dev    # http://localhost:6006
pnpm --filter @canvas/storybook build
```
