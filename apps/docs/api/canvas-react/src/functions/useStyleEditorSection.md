# Function: useStyleEditorSection()

> **useStyleEditorSection**(`options?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L41)

**Style Editor** toolbar section — an edge-routing `select` [ToolbarItem](../type-aliases/ToolbarItem.md)
built off [useEdgeType](useEdgeType.md). Selecting a type re-routes every edge in the
layer (straight / orthogonal / curved / …) and becomes the default for future
edges.

## Parameters

### options?

[`UseStyleEditorSectionOptions`](../interfaces/UseStyleEditorSectionOptions.md) = `{}`

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
