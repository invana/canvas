# Function: useFitContent()

> **useFitContent**(`layerId`, `canvas?`): [`UseFitContentResult`](../interfaces/UseFitContentResult.md)

Defined in: [canvas-react/src/hooks/useFitContent.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useFitContent.ts#L35)

Fit-to-content (zoom-to-extent) for a specific layer on the resolved canvas.
The layer is resolved lazily *inside* the returned callback, so the hook
tolerates the layer mounting after the hook runs (common, since layer
wrappers register in effects). `hasContent` tracks layer mount/unmount via
the `layer:added` / `layer:removed` canvas events.

## Parameters

### layerId

`string`

Target layer id (e.g. `'graph'`).

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

[`UseFitContentResult`](../interfaces/UseFitContentResult.md)
