# Interface: BehaviourOptions

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:35](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L35)

## Extended by

- [`DragPanBehaviourOptions`](DragPanBehaviourOptions.md)
- [`DragShapeBehaviourOptions`](DragShapeBehaviourOptions.md)
- [`WheelZoomBehaviourOptions`](WheelZoomBehaviourOptions.md)
- [`PinchZoomBehaviourOptions`](PinchZoomBehaviourOptions.md)
- [`KeyboardCameraInputBehaviourOptions`](KeyboardCameraInputBehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

***

### id

> **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L36)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.
