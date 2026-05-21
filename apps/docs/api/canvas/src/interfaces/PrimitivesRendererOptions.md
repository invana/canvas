# Interface: PrimitivesRendererOptions

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:158](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L158)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:160](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L160)

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:179](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L179)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:159](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L159)

***

### hitFloorPx?

> `readonly` `optional` **hitFloorPx?**: `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:191](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L191)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/PrimitivesRenderer.ts#L166)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
