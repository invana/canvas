# Function: importCanvasState()

> **importCanvasState**(`canvas`, `snapshot`, `opts?`): `void`

Restore a canvas from a [CanvasStateSnapshot](../interfaces/CanvasStateSnapshot.md) produced by
[exportCanvasState](exportCanvasState.md).

Because a snapshot carries options + data keyed by id but **not** class
references, the canvas must already have its layers/behaviours/layouts
registered under those same ids (e.g. the same `<Canvas>` JSX or imperative
`canvas.layers.add(...)` wiring). Import then:

1. loads each layer's bulk data (so positions/nodes exist before anything
   reads them),
2. pushes the definition — layer/behaviour/layout option slices reach each
   instance's `setOptions`; scene / templates / theme / `activeLayout` are
   written to the store. The active layout is **not** re-run, so the restored
   node positions are preserved rather than recomputed,
3. restores the interaction slice (camera via the camera action so the
   renderer's viewport follows) unless [ImportCanvasStateOptions.skipInteraction](../interfaces/ImportCanvasStateOptions.md#skipinteraction).

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### snapshot

[`CanvasStateSnapshot`](../interfaces/CanvasStateSnapshot.md)

### opts?

[`ImportCanvasStateOptions`](../interfaces/ImportCanvasStateOptions.md) = `{}`

## Returns

`void`

## Throws

if the snapshot's [CanvasStateSnapshot.version](../interfaces/CanvasStateSnapshot.md#version) is newer than
this engine understands.
