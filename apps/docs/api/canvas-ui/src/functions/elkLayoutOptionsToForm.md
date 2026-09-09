# Function: elkLayoutOptionsToForm()

> **elkLayoutOptionsToForm**(`o?`): [`ElkLayoutFields`](../interfaces/ElkLayoutFields.md)

Map an `ElkLayoutOptions`-shaped patch to the flat [ElkLayoutFields](../interfaces/ElkLayoutFields.md).
`padding` is only surfaced when it's a symmetric number (the per-side object
form is out of scope); `defaultNodeSize: { width, height }` is split into
`defaultNodeWidth` / `defaultNodeHeight`.

## Parameters

### o?

[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md) = `{}`

## Returns

[`ElkLayoutFields`](../interfaces/ElkLayoutFields.md)
