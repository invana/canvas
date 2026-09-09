# Function: wheelZoomFields()

> **wheelZoomFields**(`values?`): `FieldConfig`[]

`@invana/forms` field schema for the WheelZoomBehaviour editor. Field `name`s
match the keys of [WheelZoomFields](../interfaces/WheelZoomFields.md) 1:1 so the generator's
`options.<name>` paths line up with `mapping.ts`.

A function of the live values (like `nodeStyleFields`): the `smoothFrames`
input only appears while `smooth` is on — the form-generator's way of handling
the engine's `smooth: false | number` union.

## Parameters

### values?

[`WheelZoomFields`](../interfaces/WheelZoomFields.md) = `{}`

## Returns

`FieldConfig`[]
