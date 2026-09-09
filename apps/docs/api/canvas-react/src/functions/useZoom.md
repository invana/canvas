# Function: useZoom()

> **useZoom**(`canvas?`): [`UseZoomResult`](../interfaces/UseZoomResult.md)

Live zoom state + zoom actions for the resolved canvas. Subscribes to
`camera:zoom`, so the returned `zoom` tracks wheel / pinch / programmatic
zoom and re-renders the component.

Multi-canvas-safe: the subscription effect is keyed on the resolved instance,
so two `<Canvas>` trees (or two explicit instances) never share zoom state.

## Parameters

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

[`UseZoomResult`](../interfaces/UseZoomResult.md)
