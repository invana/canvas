# Variable: GraphCanvasContext

> `const` **GraphCanvasContext**: `Context`\<`GraphCanvas`\>

Holds the initialised [GraphCanvas](../../../canvas/src/variables/SpecStore.md) for descendant wrappers/hooks. The
same instance is also provided on [CanvasContext](CanvasContext.md) (typed as the base
`Canvas`) so existing wrappers keep working; this context is the graph-typed
view for `useGraphCanvas()` and the spec/config hooks.

`<Canvas>` only renders children once the engine is ready, so the value
inside a descendant is always non-null.
