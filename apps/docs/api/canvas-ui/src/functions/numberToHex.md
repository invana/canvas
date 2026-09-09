# Function: numberToHex()

> **numberToHex**(`n`): `string`

Colour conversion helpers. `NodeStyle` (and the rest of the engine) stores
colours as 24-bit RGB numbers (`0xRRGGBB`); HTML `<input type="color">` and
the design-kit colour swatch use `#rrggbb` strings. These bridge the two.

## Parameters

### n

`number`

## Returns

`string`
