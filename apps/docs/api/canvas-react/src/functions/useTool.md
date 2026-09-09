# Function: useTool()

> **useTool**(): [`ToolContextValue`](../interfaces/ToolContextValue.md)

Read + switch the active modelling tool (and Add-tool node kind) from a
`<GraphToolProvider>` ancestor.

Gate your drawing behaviours on the result, e.g.
`<CreateNodeBehaviour enabled={useTool().tool === 'add'} />`.

## Returns

[`ToolContextValue`](../interfaces/ToolContextValue.md)

## Throws

if no `<GraphToolProvider>` is above — a modeller without one is a
wiring bug, so this fails loudly rather than silently doing nothing.
