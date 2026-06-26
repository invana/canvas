# Interface: WheelZoomBehaviourOptions

Defined in: [canvas/src/behaviours/WheelZoomBehaviour.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L15)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L45)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L38)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### percent?

> `optional` **percent?**: `number`

Defined in: [canvas/src/behaviours/WheelZoomBehaviour.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L22)

Zoom speed per wheel tick, as a fraction. Default `0.1` (10%).

***

### requireCtrl?

> `optional` **requireCtrl?**: `boolean`

Defined in: [canvas/src/behaviours/WheelZoomBehaviour.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L20)

If `true`, only Ctrl+scroll triggers zoom; plain scroll falls through
to the browser. Good for inline canvas embeds. Default `false`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L51)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### smooth?

> `optional` **smooth?**: `number` \| `false`

Defined in: [canvas/src/behaviours/WheelZoomBehaviour.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/WheelZoomBehaviour.ts#L27)

Smooth-scroll frame count. `false` = instant snap. Default `false`.
Set to e.g. `8` for an ease-out feel.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L43)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`targetLayerId`](BehaviourOptions.md#targetlayerid)
