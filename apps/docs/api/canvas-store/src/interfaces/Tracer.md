# Interface: Tracer

Minimal tracer — structurally satisfied by an OpenTelemetry `Tracer`. Inject a
real one; the kernel keeps **no** OTel dependency (stays a renderer-free leaf).

## Methods

### startActiveSpan()?

> `optional` **startActiveSpan**\<`T`\>(`name`, `fn`): `T`

Run `fn` with `span` as the **active parent**, so any [startSpan](#startspan) called
synchronously inside `fn` auto-nests beneath it (a causal trace). Optional on the
port — OpenTelemetry's `Tracer` provides it; [traceActions](../functions/traceActions.md) falls back to a
flat span when a tracer omits it. Does **not** auto-end the span (the caller does).

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`string`

##### fn

(`span`) => `T`

#### Returns

`T`

***

### startSpan()

> **startSpan**(`name`, `options?`): [`TraceSpan`](TraceSpan.md)

#### Parameters

##### name

`string`

##### options?

###### attributes?

[`SpanAttributes`](../type-aliases/SpanAttributes.md)

#### Returns

[`TraceSpan`](TraceSpan.md)
