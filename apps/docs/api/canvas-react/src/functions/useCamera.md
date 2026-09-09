# Function: useCamera()

> **useCamera**(`canvas?`): [`UseCameraResult`](../interfaces/UseCameraResult.md)

Imperative camera actions for the resolved canvas — the wiring the
GraphVisualiser story used to hand-write inline (`camera.zoomAt(1.2)` etc.),
promoted to a reusable, multi-canvas-safe hook. Pure actions, no
subscriptions; callbacks are stable per resolved `canvas`. For a live zoom
value that re-renders, use [useZoom](useZoom.md).

## Parameters

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

[`UseCameraResult`](../interfaces/UseCameraResult.md)
