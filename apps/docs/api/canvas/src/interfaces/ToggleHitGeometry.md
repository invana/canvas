# Interface: ToggleHitGeometry

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L100)

Shape-local hit geometry exposed by a `ToggleDecoration` instance. The
`cx` / `cy` coordinates are in the host shape's local frame (i.e. add
the host's spec `x` / `y` to convert to world). `radius` is the touch
radius — typically a touch larger than the visual radius so the button
stays easy to hit on coarse pointers.

Domain behaviours read this and check `Math.hypot(worldX − host.x − cx,
worldY − host.y − cy) ≤ radius` in their `shape:pointerdown` handler.

## Properties

### cx

> `readonly` **cx**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:101](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L101)

***

### cy

> `readonly` **cy**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:102](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L102)

***

### radius

> `readonly` **radius**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:103](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L103)
