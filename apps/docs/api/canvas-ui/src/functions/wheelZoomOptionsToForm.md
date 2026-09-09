# Function: wheelZoomOptionsToForm()

> **wheelZoomOptionsToForm**(`o?`): [`WheelZoomFields`](../interfaces/WheelZoomFields.md)

Map a `WheelZoomBehaviourOptions`-shaped patch to the flat
[WheelZoomFields](../interfaces/WheelZoomFields.md) the `@invana/forms` generator renders. The engine's
`smooth: false | number` is split: `smooth` becomes a boolean toggle and the
frame count (when present) becomes `smoothFrames`.

## Parameters

### o?

[`WheelZoomOptions`](../interfaces/WheelZoomOptions.md) = `{}`

## Returns

[`WheelZoomFields`](../interfaces/WheelZoomFields.md)
