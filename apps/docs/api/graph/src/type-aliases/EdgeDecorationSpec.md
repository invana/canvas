# Type Alias: EdgeDecorationSpec

> **EdgeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `RingConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `GlowConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `MarchingAntsConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `RippleConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `FlyMarkerConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `FlowParticlesConnectorDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `RevealConnectorDecorationStyle`

Defined in: [graph/src/layer/types.ts:697](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L697)

Discriminated union of decoration specs attachable to an edge via
[EdgeStyle.decorations](../interfaces/EdgeStyle.md#decorations). Mirrors [NodeDecorationSpec](NodeDecorationSpec.md) for
the connector-target decoration registry. `label-connector` is excluded
for the same reason `label` is — labels live on the flat label fields.
