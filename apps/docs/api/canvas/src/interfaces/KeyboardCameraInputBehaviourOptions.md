# Interface: KeyboardCameraInputBehaviourOptions

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L43)

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

### keymap?

> `optional` **keymap?**: `Partial`\<[`KeyboardCameraKeymap`](KeyboardCameraKeymap.md)\>

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L52)

Override individual key groups. Merged with the defaults.

***

### panStep?

> `optional` **panStep?**: `number`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L45)

Pan distance per key press in screen pixels. Default `40`.

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

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L43)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`targetLayerId`](BehaviourOptions.md#targetlayerid)

***

### zoomFactor?

> `optional` **zoomFactor?**: `number`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L50)

Zoom multiplier per key press. `1.1` = 10% in/out per press.
Default `1.1`.
