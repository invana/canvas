# Function: textureMatrix()

> **textureMatrix**(`texture`, `cx`, `cy`, `w`, `h`, `fit?`): `Matrix`

Defined in: [packages/canvas/src/renderers/draw/shapes/textureMatrix.ts:49](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/textureMatrix.ts#L49)

Build a `Matrix` that maps local-space vertex coordinates to texture pixel
coordinates according to the given fit mode.

`(cx, cy)` is the center of the shape's bounding box in the same local space
the draw function uses. `(w, h)` are the full extents of that bounding box.

## Parameters

### texture

`Texture`

### cx

`number`

### cy

`number`

### w

`number`

### h

`number`

### fit?

[`FillFit`](../type-aliases/FillFit.md) = `'fill'`

## Returns

`Matrix`
