# Variable: ToolContext

> `const` **ToolContext**: `Context`\<[`ToolContextValue`](../interfaces/ToolContextValue.md)\>

Defined in: [canvas-react/src/ToolContext.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L33)

Holds the active [GraphTool](../type-aliases/GraphTool.md) + node kind for a modeller, set by a
`<GraphToolProvider>` and read by `useTool` / `<ModellerToolbar>`. `null` when
no provider is present — `useTool` throws in that case (a modeller toolbar
without a provider is a wiring bug, not a graceful-degrade case).
