# Type Alias: EdgeDecorationSpec

> **EdgeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`Canvas`](../../../canvas-react/src/variables/Canvas.md)

Defined in: [graph/src/layer/types.ts:727](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L727)

Discriminated union of decoration specs attachable to an edge via
[EdgeStyle.decorations](../interfaces/EdgeStyle.md#decorations). Mirrors [NodeDecorationSpec](NodeDecorationSpec.md) for
the connector-target decoration registry. `label-connector` is excluded
for the same reason `label` is — labels live on the flat label fields.
