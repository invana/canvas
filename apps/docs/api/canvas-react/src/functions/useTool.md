# Function: useTool()

> **useTool**(): [`ToolContextValue`](../interfaces/ToolContextValue.md)

Defined in: [canvas-react/src/hooks/useTool.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useTool.ts#L15)

Read + switch the active modelling tool (and Add-tool node kind) from a
`<GraphToolProvider>` ancestor.

Gate your drawing behaviours on the result, e.g.
`<CreateNodeBehaviour enabled={useTool().tool === 'add'} />`.

## Returns

[`ToolContextValue`](../interfaces/ToolContextValue.md)

## Throws

if no `<GraphToolProvider>` is above — a modeller without one is a
wiring bug, so this fails loudly rather than silently doing nothing.
