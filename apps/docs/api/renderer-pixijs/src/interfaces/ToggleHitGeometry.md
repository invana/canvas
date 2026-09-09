# Interface: ToggleHitGeometry

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

***

### cy

> `readonly` **cy**: `number`

***

### radius

> `readonly` **radius**: `number`
