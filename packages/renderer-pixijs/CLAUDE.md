# CLAUDE.md — packages/renderer-pixijs (`@invana/renderer-pixijs`)

**The PixiJS drawing backend.** Implements the renderer contract from
`@invana/canvas` and owns every pixi import in the repo.

**Status:** landed. P6 of the renderer split is complete — see
`docs/renderer-split-design.md`.

## The one rule that defines this package

> **Everything that touches `pixi.js` lives here. Nothing else does.**

`grep -rl "from 'pixi" packages/*/src apps/storybook/stories` returns **only this
package**, and that is enforced two ways: `pnpm check-boundaries`
(`scripts/check-renderer-boundary.mjs`) fails the build, and an ESLint
`no-restricted-imports` rule surfaces it in the editor. This package's own
`eslint.config.js` turns that rule off — it is the one place the import is legal.

`@invana/canvas` orchestrates, `@invana/graph` describes, this package draws.

## What it owns

| Area | Contents |
|---|---|
| Bootstrap | `PixiRenderer` — the pixi `Application`, WebGPU→WebGL fallback, shared texture-pool ref-count, render-crash guard, drawing surface, resize plumbing, scene root |
| Surfaces | `PixiSurface` — a layer's slice: spec projection, overlays, visibility, paint order, `setBackdrop` |
| Drawing | `PrimitivesRenderer` + `shapes/`, `connectors/Connector.ts`, `decorations/`, `effects/`, `markers/`, `paint/`, `base/`, `instancing/` |
| Assets | `TextureRegistry`, `loadIconFont` |
| Camera | `PixiViewportBinding` — the `pixi-viewport` realisation of `ICameraBinding` |
| Overlays | `PixiOverlayDevice` — the 11-op immediate-mode device for transient visuals |
| Capability probing | `rendererSupport` — `hasWebGPUApi` / `canUseWebGPU` / `resolveRenderPreference`. These interrogate *pixi's* backends, which is why they live here |

## What it must never own

- **Interaction state.** Selection, hover and camera transform live in
  `@invana/canvas-store`. This package projects them and reports user intent; it
  never decides anything.
- **The hit index.** Picking is interaction, not drawing (design D5). The engine
  owns the rbush index and the geometric `contains()` per spec kind; this package
  only answers `HitGeometrySource` — the three facts a spec cannot carry (visual
  scale, routed polyline, custom-kind silhouette).
- **Connector geometry.** Routers, path styles, anchors and path sampling are
  geometry answers, and §5 requires those not to need a backend. They live in
  `@invana/canvas`; this package consumes them.
- **Domain concepts.** No `node`, `edge`, `graph`, `table`, `lane`. It draws
  shapes and connectors; what they *mean* is the domain package's business.
- **Its own clock — eventually.** G3 says the engine owns the only
  `requestAnimationFrame` and calls `tick(dt)`. ⚠ **Not true yet:** pixi's
  `Application.ticker` still drives the loop via `IRenderer.startLoop`, a
  transitional seam that keeps the package move behaviour-neutral. Read the ⚠ on
  `startLoop` before building on it.

## How it is reached

Consumers inject it; `@invana/canvas` never imports it directly:

```ts
import { Canvas } from '@invana/canvas';
import { PixiRenderer } from '@invana/renderer-pixijs';

const canvas = new Canvas();
await canvas.init({ container: el, renderer: new PixiRenderer({ events: canvas.events }) });
```

`renderer` is optional — omitting it makes `Canvas.init` resolve this package by
lazy `import()` through `createDefaultRenderer` (design D1, §4.6), which is why
`@invana/canvas` declares it an **optional peer** rather than a dependency.

⚠ The engine types that dynamic import **structurally**, never against this
package's types — importing them would put `@invana/canvas` back in a build cycle
with the package it optionally depends on. The engine must compile with this one
absent. Don't "fix" that by adding a devDependency.

## Writing a second backend

This package is the reference implementation of the contract, not a special case.
A `@invana/renderer-threejs` would implement the same interfaces over meshes, an
orthographic camera and `renderOrder` stripes (`docs/renderer-split-design.md` §5).
If something here can only be expressed in pixi terms, that is a bug in the
contract — raise it rather than widening the interface with a pixi noun.

## Scene-tree naming

Every display object is named, and the names are part of the contract — a second
backend should use the same ones so debugging habits transfer:

```
stage · world · <layer id>
plane:backdrop · paint:connectors · paint:shapes · paint:overlay
<element id> → body · path · marker:source · marker:target · clip-mask
deco:<registry kind> → label:content → label:text
```

`deco:` names come from the **registry key**, never `constructor.name` — class
names mangle under minification, which is exactly where a devtools tree gets read.

## Build

`tsup` → ESM + `.d.ts` + sourcemaps. `@invana/canvas` and `@invana/canvas-store`
are externals (peers); `pixi.js` and `pixi-viewport` are dependencies.
