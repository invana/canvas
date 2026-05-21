# Abstract Class: ElementSizeLODBehaviour

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L79)

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](Behaviour.md)

## Extended by

- [`NodeSizeLODBehaviour`](../../../graph/src/classes/NodeSizeLODBehaviour.md)
- [`EdgeSizeLODBehaviour`](../../../graph/src/classes/EdgeSizeLODBehaviour.md)

## Constructors

### Constructor

> **new ElementSizeLODBehaviour**(`opts`): `ElementSizeLODBehaviour`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:104](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L104)

#### Parameters

##### opts

[`ElementSizeLODBehaviourOptions`](../interfaces/ElementSizeLODBehaviourOptions.md)

#### Returns

`ElementSizeLODBehaviour`

#### Overrides

[`Behaviour`](Behaviour.md).[`constructor`](Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L63)

#### Inherited from

[`Behaviour`](Behaviour.md).[`_enabled`](Behaviour.md#_enabled)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:64](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L64)

#### Inherited from

[`Behaviour`](Behaviour.md).[`ctx`](Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:53](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L53)

#### Inherited from

[`Behaviour`](Behaviour.md).[`id`](Behaviour.md#id)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L54)

#### Inherited from

[`Behaviour`](Behaviour.md).[`layerId`](Behaviour.md#layerid)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:61](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L61)

`'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](Behaviour.md).[`scope`](Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Inherited from

[`Behaviour`](Behaviour.md).[`shortcuts`](Behaviour.md#shortcuts)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:74](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L74)

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enabled`](Behaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:133](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L133)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`isEnabled`](Behaviour.md#isenabled)

## Methods

### apply()

> `abstract` `protected` **apply**(`scale`): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:182](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L182)

Apply rescaling at the given camera scale. Called by `onEnable`,
each `camera:zoom` (RAF coalesced), and by `onDisable` with
`scale = 1` to restore world-unit sizing.

Implementations should be idempotent — calling twice with the same
scale is a no-op visually.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L89)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`destroy`](Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`disable`](Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:97](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L97)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enable`](Behaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:118](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L118)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDestroy`](Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:134](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L134)

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDisable`](Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:125](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L125)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onEnable`](Behaviour.md#onenable)

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:110](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L110)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onRegister`](Behaviour.md#onregister)

***

### onReleaseTargets()

> `protected` **onReleaseTargets**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:170](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L170)

Optional teardown hook — drop layer refs / caches. Default no-op.

#### Returns

`void`

***

### onResolveTargets()

> `abstract` `protected` **onResolveTargets**(`ctx`): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:167](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L167)

Called once on register. Resolve layer references from `ctx.layers`
and stash them on `this` for later `apply` calls. Throw a descriptive
error if a required layer isn't present — the canvas guarantees
`ctx.layers` is fully populated before behaviours register.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### reflow()

> **reflow**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:153](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L153)

Force an immediate reflow at the current camera scale. Useful after
tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
reads from) — push the new sizes without waiting for the next zoom.

Bypasses the epsilon skip and the settle debounce — explicit calls
are always treated as "apply now."

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L79)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`register`](Behaviour.md#register)
