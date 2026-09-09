# Interface: GroupForestNode

One node of the group forest: `children` is non-empty only when this node is
an expanded group node with at least one placeable child.

## Properties

### children

> **children**: `GroupForestNode`[]

Placeable members, nested. Empty for leaves and collapsed groups.

***

### id

> **id**: `string`

***

### isCollapsed

> **isCollapsed**: `boolean`

True when this node is a group whose members are hidden inside it.

***

### isGroup

> **isGroup**: `boolean`

True when this node is a group container (expanded or collapsed).
