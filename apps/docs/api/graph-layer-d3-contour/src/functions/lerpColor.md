# Function: lerpColor()

> **lerpColor**(`a`, `b`, `t`): `number`

Defined in: [graph-layer-d3-contour/src/palettes.ts:74](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/palettes.ts#L74)

Linear interpolation between two `0xRRGGBB` colours in sRGB space.
`t` is clamped to `[0, 1]`. sRGB-linear is "good enough" for adjacent
stops in a smooth ramp; for perceptually-uniform mixing across distant
hues, supply a function via `paletteFn`.

## Parameters

### a

`number`

### b

`number`

### t

`number`

## Returns

`number`
