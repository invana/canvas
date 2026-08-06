# CLAUDE.md — packages/renderer-pixijs (`@invana/renderer-pixijs`)

**The PixiJS drawing backend.** Implements the renderer contract from
`@invana/canvas` and owns every pixi import in the repo.

**Status:** scaffolded during P6 of the renderer split — see
`docs/renderer-split-design.md`.

## The one rule that defines this package

> **Everything that touches `pixi.js` lives here. Nothing else does.**

After P6 completes, `grep -rl "from 'pixi.js'" packages/*/src` returns **only this
package**, and that invariant is lint-enforced. `@invana/canvas` orchestrates,
`@invana/graph` describes, this package draws.

## What it owns

| Area | Contents |
|---|---|
| Bootstrap | pixi `Application`, the `pixi-viewport` `Viewport`, the render surface |
| Drawing | all of `primitives/` — shapes, connectors, decorations, effects, markers, paint helpers |
| Assets | `TextureRegistry`, icon-font loading |
| Camera | the pixi-viewport realisation of the engine's abstract `{ x, y, zoom }` transform |
| Overlays | `PixiOverlayDevice` — the 11-op immediate-mode device for transient visuals |

## What it must never own

- **Interaction state.** Selection, hover and camera transform live in
  `@invana/canvas-store`. This package projects them and reports user intent; it
  never decides anything.
- **The hit index.** Picking is interaction, not drawing (design D5). The engine
  owns the rbush index and the geometric `contains()` per spec kind.
- **Domain concepts.** No `node`, `edge`, `graph`, `table`, `lane`. It draws
  shapes and connectors; what they *mean* is the domain package's business.
- **Its own clock.** The engine owns the only `requestAnimationFrame` and calls
  `tick(dt)`. Pixi's `Application` ticker stays disabled.

## How it is reached

Consumers inject it; `@invana/canvas` never imports it directly:

```ts
import { Canvas } from '@invana/canvas';
import { PixiRenderer } from '@invana/renderer-pixijs';

const canvas = await Canvas.init({ container: el, renderer: new PixiRenderer() });
```

`renderer` is optional — omitting it lazily imports this package as the default
backend (design D1), which is why `@invana/canvas` declares it an **optional
peer** rather than a dependency. That keeps the package graph honest while
existing call sites keep working.

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
