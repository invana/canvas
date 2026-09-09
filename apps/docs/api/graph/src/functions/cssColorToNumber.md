# Function: cssColorToNumber()

> **cssColorToNumber**(`input`): `number`

Parse a CSS colour string into a `0xRRGGBB` number. Handles `#rgb`, `#rrggbb`,
and `rgb()/rgba()` forms (alpha dropped). Returns `undefined` for anything it
can't read so callers fall back to the palette's own accent.

## Parameters

### input

`string`

## Returns

`number`
