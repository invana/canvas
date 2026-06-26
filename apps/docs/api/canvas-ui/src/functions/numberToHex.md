# Function: numberToHex()

> **numberToHex**(`n`): `string`

Defined in: [canvas-ui/src/utils/color.ts:7](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/utils/color.ts#L7)

Colour conversion helpers. `NodeStyle` (and the rest of the engine) stores
colours as 24-bit RGB numbers (`0xRRGGBB`); HTML `<input type="color">` and
the design-kit colour swatch use `#rrggbb` strings. These bridge the two.

## Parameters

### n

`number`

## Returns

`string`
