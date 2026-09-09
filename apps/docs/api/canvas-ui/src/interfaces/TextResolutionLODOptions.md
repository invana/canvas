# Interface: TextResolutionLODOptions

The subset of `TextResolutionLODBehaviourOptions` this editor produces — a
serialisable patch. Only the scalar knobs round-trip.

**`levels[]` is omitted on purpose.** The discrete `{ minZoom, multiplier }`
tier array is structural (an array of objects) and has no `FieldType` in the
form generator — it stays out of the form and is left untouched on
`setOptions`. The base `id` / `targetLayerId` / `enabled` / `shortcuts` are
likewise out of scope.

## Properties

### baseResolution?

> `optional` **baseResolution?**: `number`

Base resolution multiplied by the active tier's multiplier. Default
`window.devicePixelRatio`.

***

### hysteresis?

> `optional` **hysteresis?**: `number`

Hysteresis applied to downward tier changes — prevents flicker at a tier
boundary. Default `0.1`.
