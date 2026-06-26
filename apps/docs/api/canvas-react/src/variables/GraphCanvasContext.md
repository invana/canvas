# Variable: GraphCanvasContext

> `const` **GraphCanvasContext**: `Context`\<`GraphCanvas`\>

Defined in: [canvas-react/src/GraphCanvasContext.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/GraphCanvasContext.ts#L13)

Holds the initialised GraphCanvas for descendant wrappers/hooks. The
same instance is also provided on [CanvasContext](CanvasContext.md) (typed as the base
`Canvas`) so existing wrappers keep working; this context is the graph-typed
view for `useGraphCanvas()` and the spec/config hooks.

`<Canvas>` only renders children once the engine is ready, so the value
inside a descendant is always non-null.
