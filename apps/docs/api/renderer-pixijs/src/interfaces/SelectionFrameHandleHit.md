# Interface: SelectionFrameHandleHit

Per-handle hit geometry returned by [SelectionFrameDecoration.getLocalHandleHits](../classes/SelectionFrameDecoration.md#getlocalhandlehits).
`cx` / `cy` are in the host shape's local frame (add the host's spec
`x` / `y` to convert to world). `radius` is the touch radius (visual
radius + a small floor for coarse pointers).

## Properties

### cx

> `readonly` **cx**: `number`

***

### cy

> `readonly` **cy**: `number`

***

### placement

> `readonly` **placement**: [`SelectionFramePlacement`](../type-aliases/SelectionFramePlacement.md)

***

### radius

> `readonly` **radius**: `number`
