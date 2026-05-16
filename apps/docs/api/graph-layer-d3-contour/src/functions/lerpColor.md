# Function: lerpColor()

> **lerpColor**(`a`, `b`, `t`): `number`

Defined in: [graph-layer-d3-contour/src/palettes.ts:74](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-d3-contour/src/palettes.ts#L74)

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
