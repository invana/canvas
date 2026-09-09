# Type Alias: EdgeDecorationSpec

> **EdgeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md) \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & [`SpecStore`](../../../canvas/src/variables/SpecStore.md)

Discriminated union of decoration specs attachable to an edge via
[EdgeStyle.decorations](../interfaces/EdgeStyle.md#decorations). Mirrors [NodeDecorationSpec](NodeDecorationSpec.md) for
the connector-target decoration registry. `label-connector` is excluded
for the same reason `label` is — labels live on the flat label fields.
