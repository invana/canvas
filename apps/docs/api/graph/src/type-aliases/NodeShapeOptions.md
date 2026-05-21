# Type Alias: NodeShapeOptions

> **NodeShapeOptions** = [`BuiltInNodeShapeOptions`](BuiltInNodeShapeOptions.md) \| [`CustomShapeOption`](../interfaces/CustomShapeOption.md)

Defined in: [graph/src/layer/types.ts:310](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L310)

Discriminated union of node shape options. The `kind` field enforces
per-variant required fields at compile time for the six built-in kinds
registered by `@invana/canvas`. [CustomShapeOption](../interfaces/CustomShapeOption.md) provides an
open-keyed fallback for shapes registered at runtime by the consumer.

Internal call sites that need to read variant-specific fields should
narrow via the [isBuiltInNodeShape](../functions/isBuiltInNodeShape.md) type guard first — the
open-keyed `CustomShapeOption.kind` prevents `switch (shape.kind)` over
literals from excluding the custom variant on its own.
