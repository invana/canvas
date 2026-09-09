# Function: createInteractionTracer()

> **createInteractionTracer**(`bus`, `tracer`, `opts?`): () => `void`

Emit one span per user gesture, derived purely from the `render:loop:tick`
stream's [InteractionKind](../type-aliases/InteractionKind.md) transitions — no extra bus subscriptions.

A span opens when the attributed interaction leaves `'idle'` and closes when it
returns to `'idle'` (or switches to a different gesture). While open it tracks
the FPS floor and worst frame, so on close the span carries:
`interaction.kind`, `frames`, `fps.baseline` (the idle FPS just before),
`fps.min`, **`fps.drop`** (`baseline - min`, ≥0), `frame.max_ms`, and
`duration_ms`. Overlaid on the FPS metric these are the "braking markers": the
action, when it happened, and how much it cost. Returns an unsubscribe.

## Parameters

### bus

[`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

### tracer

[`Tracer`](../interfaces/Tracer.md)

### opts?

[`InteractionTracerOptions`](../interfaces/InteractionTracerOptions.md) = `{}`

## Returns

() => `void`
