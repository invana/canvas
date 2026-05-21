# Interface: SelectionFrameHandleHit

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:136](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L136)

Per-handle hit geometry returned by [SelectionFrameDecoration.getLocalHandleHits](../classes/SelectionFrameDecoration.md#getlocalhandlehits).
`cx` / `cy` are in the host shape's local frame (add the host's spec
`x` / `y` to convert to world). `radius` is the touch radius (visual
radius + a small floor for coarse pointers).

## Properties

### cx

> `readonly` **cx**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:138](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L138)

***

### cy

> `readonly` **cy**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:139](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L139)

***

### placement

> `readonly` **placement**: [`SelectionFramePlacement`](../type-aliases/SelectionFramePlacement.md)

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:137](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L137)

***

### radius

> `readonly` **radius**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:140](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L140)
