# Interface: TapOptions

Defined in: [canvas/src/events/CanvasEventBus.ts:75](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/events/CanvasEventBus.ts#L75)

## Properties

### exclude?

> `optional` **exclude?**: readonly `string`[]

Defined in: [canvas/src/events/CanvasEventBus.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/events/CanvasEventBus.ts#L81)

Suffix-matched event-type strings to exclude. Defaults to
`DEFAULT_TAP_EXCLUDE` (high-frequency noise like `pointermove`,
`render:tick`). Pass `[]` to see everything.

***

### sampleRate?

> `optional` **sampleRate?**: `number`

Defined in: [canvas/src/events/CanvasEventBus.ts:86](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/events/CanvasEventBus.ts#L86)

0..1. Probability that any given (non-excluded) event is delivered to
this tap. Default `1` (no sampling). Use for high-volume sinks.
