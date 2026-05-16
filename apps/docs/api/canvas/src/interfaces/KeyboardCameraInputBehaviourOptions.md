# Interface: KeyboardCameraInputBehaviourOptions

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L43)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### keymap?

> `optional` **keymap?**: `Partial`\<[`KeyboardCameraKeymap`](KeyboardCameraKeymap.md)\>

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:52](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L52)

Override individual key groups. Merged with the defaults.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`layerId`](BehaviourOptions.md#layerid)

***

### panStep?

> `optional` **panStep?**: `number`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L45)

Pan distance per key press in screen pixels. Default `40`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### zoomFactor?

> `optional` **zoomFactor?**: `number`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:50](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L50)

Zoom multiplier per key press. `1.1` = 10% in/out per press.
Default `1.1`.
