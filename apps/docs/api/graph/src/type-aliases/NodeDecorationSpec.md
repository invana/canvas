# Type Alias: NodeDecorationSpec

> **NodeDecorationSpec** = [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `RingDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `GlowDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `PulseRingDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `MarchingAntsDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `LiquidFillDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `ToggleDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `ResizeHandleDecorationStyle` \| [`DecorationSpecCommon`](../interfaces/DecorationSpecCommon.md) & `object` & `SelectionFrameDecorationStyle`

Defined in: [graph/src/layer/types.ts:681](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L681)

Discriminated union of decoration specs attachable to a node via
[NodeStyle.decorations](../interfaces/NodeStyle.md#decorations). Each variant pairs `kind` (the registered
canvas decoration name) with the matching style payload from
`@invana/canvas/primitives`.

Multiples are allowed — the same kind can appear several times (e.g. an
inner + outer ring on a single node), as long as their `id`s differ.
`label` is intentionally absent — labels are managed by the flat
`labelText` / `label*` fields on `NodeStyle`, not by the decorations
array.
