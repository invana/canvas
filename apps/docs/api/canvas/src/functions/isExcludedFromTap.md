# Function: isExcludedFromTap()

> **isExcludedFromTap**(`type`, `exclude?`): `boolean`

Defined in: [packages/canvas/src/events/CanvasEvent.ts:83](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/CanvasEvent.ts#L83)

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
