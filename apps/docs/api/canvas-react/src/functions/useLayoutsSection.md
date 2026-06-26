# Function: useLayoutsSection()

> **useLayoutsSection**(`options`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L31)

**Layouts** toolbar section — a layout-picker `select` [ToolbarItem](../type-aliases/ToolbarItem.md)
built off [useLayout](useLayout.md) (applies the chosen layout + fits the view).
Layouts live in separate packages, so the consumer supplies the factory map
(memoize it).

## Parameters

### options

[`UseLayoutsSectionOptions`](../interfaces/UseLayoutsSectionOptions.md)

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
