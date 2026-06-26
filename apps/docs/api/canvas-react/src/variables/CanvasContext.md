# Variable: CanvasContext

> `const` **CanvasContext**: `Context`\<`Canvas`\>

Defined in: [canvas-react/src/CanvasContext.ts:9](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/CanvasContext.ts#L9)

Holds the initialised engine `Canvas` for all descendant child wrappers.
`<Canvas>` only renders children once the engine is ready, so the context
value inside a wrapper is always non-null.
