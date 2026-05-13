# Interface: WheelZoomBehaviourOptions

Defined in: [packages/canvas/src/behaviours/WheelZoomBehaviour.ts:15](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L15)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`layerId`](BehaviourOptions.md#layerid)

***

### percent?

> `optional` **percent?**: `number`

Defined in: [packages/canvas/src/behaviours/WheelZoomBehaviour.ts:22](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L22)

Zoom speed per wheel tick, as a fraction. Default `0.1` (10%).

***

### requireCtrl?

> `optional` **requireCtrl?**: `boolean`

Defined in: [packages/canvas/src/behaviours/WheelZoomBehaviour.ts:20](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L20)

If `true`, only Ctrl+scroll triggers zoom; plain scroll falls through
to the browser. Good for inline canvas embeds. Default `false`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### smooth?

> `optional` **smooth?**: `number` \| `false`

Defined in: [packages/canvas/src/behaviours/WheelZoomBehaviour.ts:27](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L27)

Smooth-scroll frame count. `false` = instant snap. Default `false`.
Set to e.g. `8` for an ease-out feel.
