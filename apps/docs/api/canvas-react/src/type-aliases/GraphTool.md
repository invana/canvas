# Type Alias: GraphTool

> **GraphTool** = `"select"` \| `"add"` \| `"connect"` \| `"delete"`

Defined in: [canvas-react/src/ToolContext.ts:9](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ToolContext.ts#L9)

The active modelling tool. `'select'` is the neutral pointer (drag / select);
`'add'` drops nodes; `'connect'` draws edges; `'delete'` erases on click.
A string-literal union, but consumers may treat it opaquely — the
[ModellerToolbar](../variables/Canvas.md) only renders the tools it's told to.
