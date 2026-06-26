# Type Alias: NodeDecorationSpec

> **NodeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md)

Defined in: [graph/src/layer/types.ts:711](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L711)

Discriminated union of decoration specs attachable to a node via
[NodeStyle.decorations](../interfaces/NodeStyle.md#decorations). Each variant pairs `kind` (the registered
canvas decoration name) with the matching style payload from
`@invana/canvas/primitives`.

Multiples are allowed — the same kind can appear several times (e.g. an
inner + outer ring on a single node), as long as their `id`s differ.
`label` is intentionally absent — labels are managed by the flat
`labelText` / `label*` fields on `NodeStyle`, not by the decorations
array.
