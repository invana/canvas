# Interface: NodeResizeBehaviourOptions

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### dashArray?

> `optional` **dashArray?**: readonly \[`number`, `number`\]

Dash pattern `[dashLength, gapLength]` in px. Default `[5, 4]`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### frameColor?

> `optional` **frameColor?**: `number`

Frame border + handle outline colour. Default `0x6b7fff`.

***

### framePadding?

> `optional` **framePadding?**: `number`

Gap between host silhouette and the dashed frame. Default `4`.

***

### handleFill?

> `optional` **handleFill?**: `number`

Handle fill colour. Default `0xffffff`.

***

### handleRadius?

> `optional` **handleRadius?**: `number`

Handle outer radius in px. Default `5`.

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### minSize?

> `optional` **minSize?**: `number`

Minimum width / height / radius the behaviour allows during drag. Default `20`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
