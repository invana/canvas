# Interface: WheelZoomOptions

The subset of `WheelZoomBehaviourOptions` this editor produces — a
serialisable patch. Function/`shortcuts` options are out of scope; only the
user-tunable scalars round-trip. `smooth` keeps the engine's `false | number`
encoding (`false` = instant snap, a number = ease-out frame count).

## Properties

### percent?

> `optional` **percent?**: `number`

***

### requireCtrl?

> `optional` **requireCtrl?**: `boolean`

***

### smooth?

> `optional` **smooth?**: `number` \| `false`
