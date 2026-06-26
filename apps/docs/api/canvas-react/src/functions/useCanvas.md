# Function: useCanvas()

> **useCanvas**(): `Canvas`

Defined in: [canvas-react/src/CanvasContext.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/CanvasContext.ts#L16)

Read the engine `Canvas` from context. Throws when used outside a
`<Canvas>` so misuse fails loudly during render instead of silently
skipping the effect that would have registered a layer or behaviour.

## Returns

`Canvas`
