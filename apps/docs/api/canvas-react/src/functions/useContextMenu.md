# Function: useContextMenu()

> **useContextMenu**\<`T`\>(): [`UseContextMenuResult`](../interfaces/UseContextMenuResult.md)\<`T`\>

Defined in: [canvas-react/src/hooks/useContextMenu.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L51)

Headless open/close + position state for a right-click context menu, with the
dismissal lifecycle baked in: while a menu is open, an outside `pointerdown`
or `Escape` closes it.

Pairs with `<ContextMenuBehaviour onContextMenu={…}>` (which supplies the
target + `screen` position) and `<ContextMenuOverlay>` (which renders the
menu). Feed `e.screen.x / e.screen.y` straight into open; because the
`<Canvas>` host is `position: relative`, those coordinates place the overlay
correctly when it's rendered as a `<Canvas>` descendant.

The opening right-click's `pointerdown` fires *before* this effect's listener
attaches, so the menu never self-closes. `<ContextMenuOverlay>` stops
`pointerdown` propagation, so clicks *inside* the menu don't dismiss it —
leaf `onClick`s call close explicitly.

Generic over the payload `T` so it stays UI-kit-agnostic; the graph stories
parameterise it as `MenuItem[]` (from `@invana/ui`).

## Type Parameters

### T

`T`

## Returns

[`UseContextMenuResult`](../interfaces/UseContextMenuResult.md)\<`T`\>

## Example

```tsx
const { menu, open, close } = useContextMenu<MenuItem[]>();
const onContextMenu = (e: ContextMenuEvent) =>
  open(e.screen.x, e.screen.y, buildItems(e, close));
// …
<ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
{menu && <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} />}
```
