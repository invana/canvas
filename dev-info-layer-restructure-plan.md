# Remove `toolkit/` — fold `DevInfoLayer` into `layers/`

## Context

The first port (see `dev-info-layer-plan.md`) put `DevInfoLayer` in a new `packages/canvas/src/toolkit/` directory with a dedicated `@invana/canvas/toolkit` subpath export — mirroring the aspirational wording in `packages/canvas/CLAUDE.md`'s "Subpath exports" section.

But the established convention for built-in concrete classes is different: look at `packages/canvas/src/index.ts:72-92` — built-in behaviours (`DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`, `DragShapeBehaviour`) all live in `src/behaviours/` and are re-exported from the main `@invana/canvas` entry. No `./behaviours` subpath. The "toolkit" bucket is a new concept that doesn't carry its weight — DevInfoLayer is just a Layer; it belongs alongside `WorldLayer` / `ScreenLayer`.

Goal: kill the `toolkit/` directory and `./toolkit` subpath export. `DevInfoLayer` moves into `src/layers/` and is exported from the kernel like every other built-in.

---

## Changes

### Move

- `packages/canvas/src/toolkit/DevInfoLayer.ts` → `packages/canvas/src/layers/DevInfoLayer.ts` (no code changes; the relative `import { ScreenLayer, ... } from '../layers/ScreenLayer'` becomes `from './ScreenLayer'`)

### Delete

- `packages/canvas/src/toolkit/index.ts`
- The empty `packages/canvas/src/toolkit/` directory

### Edit

1. **`packages/canvas/src/index.ts`** — add to the `// ─── Layers ───` section (after the existing `ScreenLayer` exports at line 70):

   ```ts
   export { DevInfoLayer } from './layers/DevInfoLayer';
   export type {
     DevInfoLayerOptions,
     DevInfoLayerCtorOptions,
     DevInfoCorner,
   } from './layers/DevInfoLayer';
   ```

2. **`packages/canvas/package.json`** — remove the `"./toolkit"` entry from `"exports"`. Leaves `.` and `./primitives`.

3. **`packages/canvas/tsup.config.ts`** — drop `'src/toolkit/index.ts'` from the `entry` array. Leaves `['src/index.ts', 'src/primitives/index.ts']`.

4. **`apps/storybook/stories/Layers/DevInfoLayer.stories.ts`** — change the imports:
   - Remove `import { DevInfoLayer } from '@invana/canvas/toolkit';`
   - Remove `import type { DevInfoCorner } from '@invana/canvas/toolkit';`
   - Add `DevInfoLayer` and the `DevInfoCorner` type to the existing `from '@invana/canvas'` import lines.

5. **`packages/canvas/CLAUDE.md`** — bring the wording in line with the actual convention:
   - In the "Subpath exports" section, remove the `@invana/canvas/toolkit` bullet. The remaining subpaths are `@invana/canvas` (kernel) and `@invana/canvas/renderers/shapes` (still aspirational; leave as-is since it's a separate question).
   - In the "Scope" / "Built-in layers" line, drop "(via `./toolkit` subpath)" framing if/where it appears. State plainly: built-in layers and built-in behaviours are exported from the kernel `@invana/canvas` entry, the same way `DragPanBehaviour` etc. already are.

---

## Critical files (reference)

- `packages/canvas/src/index.ts` — re-export point; line 62-70 is where the new exports slot in
- `packages/canvas/src/layers/ScreenLayer.ts` — the base; relative import target inside the moved file
- `packages/canvas/package.json` — `"exports"` block
- `packages/canvas/tsup.config.ts` — `entry` array
- `apps/storybook/stories/Layers/DevInfoLayer.stories.ts` — only consumer that imports from `/toolkit`
- `packages/canvas/CLAUDE.md` — "Subpath exports" section

## Out of scope

- The existing `dev-info-layer-plan.md` at repo root is left as a historical record of the initial port. This plan is the follow-up restructure.
- `BackgroundLayer`, `ThemedBackgroundLayer`, and any future "built-in layer" follow the same convention when ported: live in `src/layers/`, re-exported from `src/index.ts`. They're not part of *this* plan.

---

## Verification

1. `pnpm --filter @invana/canvas check-types` — clean.
2. `pnpm --filter @invana/canvas build` — confirm `dist/toolkit/` is gone, only `dist/index.js` and `dist/primitives/index.js` are emitted.
3. `pnpm --filter @canvas/storybook check-types` — clean (catches any straggling `@invana/canvas/toolkit` import).
4. `pnpm --filter @canvas/storybook dev` → `Layers / DevInfoLayer` — story still renders, overlay still updates on pan/zoom/pointermove and the GUI controls still work.
