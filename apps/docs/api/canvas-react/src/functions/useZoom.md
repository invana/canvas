# Function: useZoom()

> **useZoom**(`canvas?`): [`UseZoomResult`](../interfaces/UseZoomResult.md)

Defined in: [canvas-react/src/hooks/useZoom.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useZoom.ts#L26)

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
