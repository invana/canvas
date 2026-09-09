# Variable: ToolContext

> `const` **ToolContext**: `Context`\<[`ToolContextValue`](../interfaces/ToolContextValue.md)\>

Holds the active [GraphTool](../type-aliases/GraphTool.md) + node kind for a modeller, set by a
`<GraphToolProvider>` and read by `useTool` / `<ModellerToolbar>`. `null` when
no provider is present — `useTool` throws in that case (a modeller toolbar
without a provider is a wiring bug, not a graceful-degrade case).
