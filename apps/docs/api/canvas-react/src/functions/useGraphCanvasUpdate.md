# Function: useGraphCanvasUpdate()

> **useGraphCanvasUpdate**(): (`patch`) => `void`

Defined in: [canvas-react/src/hooks/useGraphCanvasUpdate.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGraphCanvasUpdate.ts#L14)

Returns a stable `update(patch)` bound to the canvas in context. `patch` is a
[CanvasConfig](../interfaces/CanvasConfig.md) slice keyed by instance id — deep-merged into the held
config and fanned to each instance's `setOptions` (and re-wires `activeLayout`
on a `GraphCanvas`). The serialisable counterpart to driving the engine
imperatively; use it for live edits (theme toggle, GUI controls) over a
`<Canvas config={…}>`.

## Returns

(`patch`) => `void`
