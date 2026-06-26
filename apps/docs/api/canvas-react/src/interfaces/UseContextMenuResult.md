# Interface: UseContextMenuResult\<T\>

Defined in: [canvas-react/src/hooks/useContextMenu.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L13)

## Type Parameters

### T

`T`

## Properties

### close

> **close**: () => `void`

Defined in: [canvas-react/src/hooks/useContextMenu.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L19)

Close the menu.

#### Returns

`void`

***

### menu

> **menu**: [`ContextMenuState`](ContextMenuState.md)\<`T`\>

Defined in: [canvas-react/src/hooks/useContextMenu.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L15)

Current open menu, or `null` when closed.

***

### open

> **open**: (`x`, `y`, `items`) => `void`

Defined in: [canvas-react/src/hooks/useContextMenu.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L17)

Open (or move) the menu at `(x, y)` carrying `items`.

#### Parameters

##### x

`number`

##### y

`number`

##### items

`T`

#### Returns

`void`
