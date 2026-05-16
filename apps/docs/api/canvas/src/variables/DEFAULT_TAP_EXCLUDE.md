# Variable: DEFAULT\_TAP\_EXCLUDE

> `const` **DEFAULT\_TAP\_EXCLUDE**: readonly `string`[]

Defined in: [canvas/src/events/CanvasEvent.ts:70](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEvent.ts#L70)

Default exclude list for the tap channel.

High-frequency events that would flood telemetry without adding signal.
Consumers can override per `tap()` registration:
  `canvas.events.tap(fn, { exclude: [] })` — see everything.
  `canvas.events.tap(fn, { exclude: ['canvas:camera:zoom'] })` — explicit override.

The strings are matched as **suffixes** of the envelope `type` so we don't
have to enumerate every layer instance. `'pointermove'` excludes
`'layer:graph-1:shape:pointermove'`, `'layer:er-7:shape:pointermove'`, …
