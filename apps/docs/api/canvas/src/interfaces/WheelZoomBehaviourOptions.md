# Interface: WheelZoomBehaviourOptions

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### percent?

> `optional` **percent?**: `number`

Zoom speed per wheel tick, as a fraction. Default `0.1` (10%).

***

### requireCtrl?

> `optional` **requireCtrl?**: `boolean`

If `true`, only Ctrl+scroll triggers zoom; plain scroll falls through
to the browser. Good for inline canvas embeds. Default `false`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### smooth?

> `optional` **smooth?**: `number` \| `false`

Smooth-scroll frame count. `false` = instant snap. Default `false`.
Set to e.g. `8` for an ease-out feel.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`targetLayerId`](BehaviourOptions.md#targetlayerid)
