# Function: useGraphCanvasUpdate()

> **useGraphCanvasUpdate**(): (`patch`) => `void`

Returns a stable `update(patch)` bound to the canvas in context. `patch` is a
[CanvasConfig](../interfaces/CanvasConfig.md) slice keyed by instance id — deep-merged into the held
config and fanned to each instance's `setOptions` (and re-wires `activeLayout`
on a `GraphCanvas`). The serialisable counterpart to driving the engine
imperatively; use it for live edits (theme toggle, GUI controls) over a
`<Canvas config={…}>`.

## Returns

(`patch`) => `void`
