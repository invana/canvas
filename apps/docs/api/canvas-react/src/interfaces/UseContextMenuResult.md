# Interface: UseContextMenuResult\<T\>

## Type Parameters

### T

`T`

## Properties

### close

> **close**: () => `void`

Close the menu.

#### Returns

`void`

***

### menu

> **menu**: [`ContextMenuState`](ContextMenuState.md)\<`T`\>

Current open menu, or `null` when closed.

***

### open

> **open**: (`x`, `y`, `items`) => `void`

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
