# Interface: ResolvedColorByOptions

Every option resolved to a concrete value — nothing past the constructor
writes `?? default`.

Exported because [ColorByBehaviour.getResolvedOptions](../classes/ColorByBehaviour.md#getresolvedoptions) hands it out:
the base `getOptions()` returns only what the caller *passed*, which omits
every default and so can't answer "what is this behaviour actually doing".

## Properties

### bins

> **bins**: `number`

***

### colorEdges

> **colorEdges**: `boolean`

***

### colorNodes

> **colorNodes**: `boolean`

***

### colorStops

> **colorStops**: readonly `number`[]

***

### edgeDomain

> **edgeDomain**: readonly \[`number`, `number`\]

***

### edgeThresholds

> **edgeThresholds**: readonly `number`[]

***

### edgeValueBy

> **edgeValueBy**: [`ColorValueAccessor`](../type-aliases/ColorValueAccessor.md)\<[`GraphEdge`](GraphEdge.md)\<`unknown`\>\>

***

### edgeValueKey

> **edgeValueKey**: `string`

***

### fallbackColor

> **fallbackColor**: `number`

***

### maxCategories

> **maxCategories**: `number`

***

### mode

> **mode**: [`ColorByMode`](../type-aliases/ColorByMode.md)

***

### nodeDomain

> **nodeDomain**: readonly \[`number`, `number`\]

***

### nodeThresholds

> **nodeThresholds**: readonly `number`[]

***

### nodeValueBy

> **nodeValueBy**: [`ColorValueAccessor`](../type-aliases/ColorValueAccessor.md)\<[`GraphNode`](GraphNode.md)\<`unknown`\>\>

***

### nodeValueKey

> **nodeValueKey**: `string`

***

### palette

> **palette**: readonly `number`[]

***

### scale

> **scale**: [`ColorByScale`](../type-aliases/ColorByScale.md)

***

### valueColors

> **valueColors**: `Readonly`\<`Record`\<`string`, `number`\>\>
