# Interface: PrimitivesRendererOptions

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:159](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L159)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:161](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L161)

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:180](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L180)

Optional DOM `<canvas>` element. Used by `hitMode: 'indexed'` to
apply `cursor: pointer` on shape/connector hover (Pixi's native
`gfx.cursor` auto-application is bypassed in indexed mode because
`eventMode = 'none'` skips the federated hit-test walk).

When omitted in indexed mode, hover-cursor styling is a no-op —
shape/connector hits still emit `pointerover` / `pointerout` events
to behaviours, just without the cursor feedback. Most consumers
should pass this; `GraphLayer` forwards `CanvasContext.canvasElement`
automatically.

***

### container

> `readonly` **container**: `Container`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:160](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L160)

***

### hitFloorPx?

> `readonly` `optional` **hitFloorPx?**: `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:192](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L192)

Minimum hover/click target in screen pixels — used as a *fallback*
by hitTest: exact geometric hits always win; only when no
shape contains the cursor does the dispatcher pick the closest
candidate within this many screen pixels of its origin. Exact
hits are never widened, so dense graphs don't suffer false
positives.

Default `6` (cursor-friendly). Raise (`8`–`12`) for touch-friendly
stories; drop to `0` to forbid the fallback entirely.

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:167](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L167)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
