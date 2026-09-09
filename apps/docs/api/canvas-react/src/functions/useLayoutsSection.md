# Function: useLayoutsSection()

> **useLayoutsSection**(`options`): `ToolbarItem`[]

**Layouts** toolbar section — a layout-picker `select` ToolbarItem
built off [useLayout](useLayout.md) (applies the chosen layout + fits the view).
Layouts live in separate packages, so the consumer supplies the factory map
(memoize it).

## Parameters

### options

[`UseLayoutsSectionOptions`](../interfaces/UseLayoutsSectionOptions.md)

## Returns

`ToolbarItem`[]
