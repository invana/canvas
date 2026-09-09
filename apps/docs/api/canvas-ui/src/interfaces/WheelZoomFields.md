# Interface: WheelZoomFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`smooth: false | number` union is split into a `smooth` boolean toggle plus a
`smoothFrames` number (see `mapping.ts`), because a single field can't be both.

## Properties

### percent?

> `optional` **percent?**: `number`

***

### requireCtrl?

> `optional` **requireCtrl?**: `boolean`

***

### smooth?

> `optional` **smooth?**: `boolean`

Whether smooth-scroll easing is on. Maps to `smooth !== false`.

***

### smoothFrames?

> `optional` **smoothFrames?**: `number`

Ease-out frame count, used only when [smooth](#smooth) is `true`.
