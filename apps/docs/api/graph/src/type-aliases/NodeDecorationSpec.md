# Type Alias: NodeDecorationSpec

> **NodeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md)

Discriminated union of decoration specs attachable to a node via
[NodeStyle.decorations](../interfaces/NodeStyle.md#decorations). Each variant pairs `kind` (the registered
canvas decoration name) with the matching style payload from
`@invana/canvas`.

Multiples are allowed — the same kind can appear several times (e.g. an
inner + outer ring on a single node), as long as their `id`s differ.
`label` is intentionally absent — labels are managed by the flat
`labelText` / `label*` fields on `NodeStyle`, not by the decorations
array.
