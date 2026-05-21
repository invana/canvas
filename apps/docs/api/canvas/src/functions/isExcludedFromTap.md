# Function: isExcludedFromTap()

> **isExcludedFromTap**(`type`, `exclude?`): `boolean`

Defined in: [canvas/src/events/CanvasEvent.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/events/CanvasEvent.ts#L83)

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
