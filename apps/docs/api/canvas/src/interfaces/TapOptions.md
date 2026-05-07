# Interface: TapOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:75](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEventBus.ts#L75)

## Properties

### exclude?

> `optional` **exclude?**: readonly `string`[]

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:81](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEventBus.ts#L81)

Suffix-matched event-type strings to exclude. Defaults to
`DEFAULT_TAP_EXCLUDE` (high-frequency noise like `pointermove`,
`render:tick`). Pass `[]` to see everything.

***

### sampleRate?

> `optional` **sampleRate?**: `number`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:86](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEventBus.ts#L86)

0..1. Probability that any given (non-excluded) event is delivered to
this tap. Default `1` (no sampling). Use for high-volume sinks.
