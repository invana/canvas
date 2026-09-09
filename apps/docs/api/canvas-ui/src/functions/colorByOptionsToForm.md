# Function: colorByOptionsToForm()

> **colorByOptionsToForm**(`o?`): [`ColorByFields`](../interfaces/ColorByFields.md)

Map a `ColorByBehaviourOptions`-shaped patch to the flat [ColorByFields](../interfaces/ColorByFields.md)
the `@invana/forms` generator renders.

Three encodings happen here (see [ColorByFields](../interfaces/ColorByFields.md)): the `0xRRGGBB`
`fallbackColor` becomes `#rrggbb`, each `[min, max]` domain splits into two
number fields, and each threshold array becomes comma-separated text.

## Parameters

### o?

[`ColorByOptions`](../interfaces/ColorByOptions.md) = `{}`

## Returns

[`ColorByFields`](../interfaces/ColorByFields.md)
