# Interface: PrimitivesRendererOptions

## Properties

### camera

> `readonly` **camera**: [`Camera`](../../../canvas/src/classes/Camera.md)

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

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

***

### hitFloorPx?

> `readonly` `optional` **hitFloorPx?**: `number`

Minimum hover/click target in screen pixels — used as a *fallback*
by hitTest: exact geometric hits always win; only when no
shape contains the cursor does the dispatcher pick the closest
candidate within this many screen pixels of its origin. Exact
hits are never widened, so dense graphs don't suffer false
positives.

Default `6` (cursor-friendly). Raise (`8`–`12`) for touch-friendly
stories; drop to `0` to forbid the fallback entirely.

***

### hoverHysteresisPx?

> `readonly` `optional` **hoverHysteresisPx?**: `number`

Hover **hysteresis** margin in screen pixels (edge-pick correctness I).
On the hover path only, the currently-hovered element of the same kind
is kept until a new candidate is closer by *more* than this many pixels
— so a sub-pixel jitter between two near-equidistant edges doesn't
flicker the highlight. Click / drag picking ignores this entirely.
Default `5`; `0` disables the stickiness.

***

### hoverNodeIncidencePx?

> `readonly` `optional` **hoverNodeIncidencePx?**: `number`

Hover **node-incidence** radius in screen pixels (edge-pick correctness
J). When the hover winner is a connector and the cursor also sits within
this many pixels of a shape's centre, an edge *incident to that shape*
(an endpoint at the node) is preferred over an unrelated edge merely
passing through — incident edges separate near their shared endpoint,
where you aim. Purely geometric (endpoint-at-node), so the renderer stays
domain-free. Default `20`; `0` disables the bias.

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
