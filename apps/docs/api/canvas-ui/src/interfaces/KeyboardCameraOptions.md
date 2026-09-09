# Interface: KeyboardCameraOptions

The subset of `KeyboardCameraInputBehaviourOptions` this editor produces — a
serialisable patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts`
fields are out of scope, and the structural `keymap` object is omitted (too
nested for a form); only the tunable scalars round-trip.

## Properties

### panStep?

> `optional` **panStep?**: `number`

Pan distance per key press in screen pixels.

***

### zoomFactor?

> `optional` **zoomFactor?**: `number`

Zoom multiplier per key press. `1.1` = 10% in/out per press.
