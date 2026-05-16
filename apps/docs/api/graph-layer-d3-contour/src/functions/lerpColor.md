# Function: lerpColor()

> **lerpColor**(`a`, `b`, `t`): `number`

Defined in: [graph-layer-d3-contour/src/palettes.ts:74](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/palettes.ts#L74)

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
