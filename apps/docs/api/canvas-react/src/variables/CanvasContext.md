# Variable: CanvasContext

> `const` **CanvasContext**: `Context`\<`Canvas`\>

Holds the initialised engine `Canvas` for all descendant child wrappers.
`<Canvas>` only renders children once the engine is ready, so the context
value inside a wrapper is always non-null.
