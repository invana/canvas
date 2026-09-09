# Function: traceActions()

> **traceActions**\<`A`\>(`actions`, `tracer`, `opts?`): `A`

**Decorator that traces the command API.** Wraps a [CanvasActions](../type-aliases/CanvasActions.md)-shaped
object (a `Record` of grouped methods — `node.add`, `camera.zoom`,
`layers.setStyle`, …) so **every call opens a span** named `<prefix><group>.<method>`,
captures its arguments as attributes, and (with an active-span-capable [Tracer](../interfaces/Tracer.md))
runs the call as the active parent — so the mutation's whole synchronous ripple
(`state:change` / granular / `data:intent`, traced by [createTapTracer](createTapTracer.md))
**nests beneath it** as one causal trace. This is the port-decorator idiom (cf.
[withTelemetry](withTelemetry.md)) applied to the actions: query + interaction patterns become
traces without the caller wrapping anything.

Returns a **new** object with the same shape (the original is untouched). Non-function
members and functions are wrapped; nested groups recurse.

## Type Parameters

### A

`A` *extends* `object`

## Parameters

### actions

`A`

### tracer

[`Tracer`](../interfaces/Tracer.md)

### opts?

#### prefix?

`string`

## Returns

`A`
