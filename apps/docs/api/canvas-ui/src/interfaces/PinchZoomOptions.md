# Interface: PinchZoomOptions

The subset of `PinchZoomBehaviourOptions` this editor produces — a
serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
fields are out of scope; only the user-tunable scalars round-trip.

## Properties

### noDrag?

> `optional` **noDrag?**: `boolean`

If `true`, suppress the implicit pan that accompanies a pinch gesture.

***

### percent?

> `optional` **percent?**: `number`

Zoom speed multiplier.
