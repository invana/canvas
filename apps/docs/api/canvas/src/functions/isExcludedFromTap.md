# Function: isExcludedFromTap()

> **isExcludedFromTap**(`type`, `exclude?`): `boolean`

Defined in: [packages/canvas/src/events/CanvasEvent.ts:83](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/events/CanvasEvent.ts#L83)

Returns true if the given envelope type should be excluded from the tap
channel under the supplied exclude list. Exclusion is suffix-based so
source-id variations don't require enumerating every emitter.

## Parameters

### type

`string`

### exclude?

readonly `string`[] = `DEFAULT_TAP_EXCLUDE`

## Returns

`boolean`
