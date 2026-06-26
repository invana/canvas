# Interface: TapOptions

Defined in: [canvas/src/events/CanvasEventBus.ts:109](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L109)

## Properties

### exclude?

> `optional` **exclude?**: readonly `string`[]

Defined in: [canvas/src/events/CanvasEventBus.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L115)

Suffix-matched event-type strings to exclude. Defaults to
`DEFAULT_TAP_EXCLUDE` (high-frequency noise like `pointermove`,
`render:tick`). Pass `[]` to see everything.

***

### sampleRate?

> `optional` **sampleRate?**: `number`

Defined in: [canvas/src/events/CanvasEventBus.ts:120](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L120)

0..1. Probability that any given (non-excluded) event is delivered to
this tap. Default `1` (no sampling). Use for high-volume sinks.
