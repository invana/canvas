# Function: boundsOfSpec()

> **boundsOfSpec**(`spec`): [`Rect`](../interfaces/Rect.md)

Local bounds of any built-in spec kind, or `undefined` for a kind this module
doesn't know.

`undefined` is a real answer, not a failure: `registerShape` admits
third-party kinds, so callers that must cover those ask the registry (which
consults the class's `static boundsOf`) and fall back to a default box.

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

## Returns

[`Rect`](../interfaces/Rect.md)
