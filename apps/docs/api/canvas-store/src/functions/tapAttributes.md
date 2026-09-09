# Function: tapAttributes()

> **tapAttributes**(`ev`): [`SpanAttributes`](../type-aliases/SpanAttributes.md)

Derive span attributes from a [CanvasEvent](../../../canvas/src/interfaces/CanvasEvent.md) envelope — the `source`, plus
the dashboard-useful fields off the kernel's well-known payload shapes:
`action` / `changed_paths` / `duration_ms` (view mutations), `layer_id` +
`ids_count` (data intents), the per-kind `data:flush` delta counts, and `id`
(input on an element). Defensive — only sets an attribute when the field exists,
so foreign / future event types degrade to just the source attributes.

## Parameters

### ev

[`CanvasEvent`](../../../canvas/src/interfaces/CanvasEvent.md)

## Returns

[`SpanAttributes`](../type-aliases/SpanAttributes.md)
