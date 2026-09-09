# Type Alias: NodeShapeOptions

> **NodeShapeOptions** = [`BuiltInNodeShapeOptions`](BuiltInNodeShapeOptions.md) \| [`CompositeShapeOption`](../interfaces/CompositeShapeOption.md) \| [`CustomShapeOption`](../interfaces/CustomShapeOption.md)

Discriminated union of node shape options. The `kind` field enforces
per-variant required fields at compile time for the six built-in kinds
registered by `@invana/canvas`. [CustomShapeOption](../interfaces/CustomShapeOption.md) provides an
open-keyed fallback for shapes registered at runtime by the consumer.

Internal call sites that need to read variant-specific fields should
narrow via the [isBuiltInNodeShape](../functions/isBuiltInNodeShape.md) type guard first — the
open-keyed `CustomShapeOption.kind` prevents `switch (shape.kind)` over
literals from excluding the custom variant on its own.
