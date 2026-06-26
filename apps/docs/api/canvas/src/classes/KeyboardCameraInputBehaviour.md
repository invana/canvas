# Class: KeyboardCameraInputBehaviour

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L55)

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](Behaviour.md)

## Constructors

### Constructor

> **new KeyboardCameraInputBehaviour**(`opts`): `KeyboardCameraInputBehaviour`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L61)

#### Parameters

##### opts

[`KeyboardCameraInputBehaviourOptions`](../interfaces/KeyboardCameraInputBehaviourOptions.md)

#### Returns

`KeyboardCameraInputBehaviour`

#### Overrides

[`Behaviour`](Behaviour.md).[`constructor`](Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L65)

#### Inherited from

[`Behaviour`](Behaviour.md).[`_enabled`](Behaviour.md#_enabled)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L66)

#### Inherited from

[`Behaviour`](Behaviour.md).[`ctx`](Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Inherited from

[`Behaviour`](Behaviour.md).[`id`](Behaviour.md#id)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L63)

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](Behaviour.md).[`scope`](Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L57)

#### Inherited from

[`Behaviour`](Behaviour.md).[`shortcuts`](Behaviour.md#shortcuts)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L56)

#### Inherited from

[`Behaviour`](Behaviour.md).[`targetLayerId`](Behaviour.md#targetlayerid)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L76)

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enabled`](Behaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L139)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`isEnabled`](Behaviour.md#isenabled)

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L80)

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

#### Inherited from

[`Behaviour`](Behaviour.md).[`isRegistered`](Behaviour.md#isregistered)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:95](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L95)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`destroy`](Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:109](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L109)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`disable`](Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enable`](Behaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(`_ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L121)

Cleanup on destroy. Default no-op.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`onDestroy`](Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L77)

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDisable`](Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L72)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onEnable`](Behaviour.md#onenable)

***

### onRegister()

> `protected` **onRegister**(`_ctx`): `void`

Defined in: [canvas/src/behaviours/KeyboardCameraInputBehaviour.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L70)

Subscribe to events / setup any handler resources.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onRegister`](Behaviour.md#onregister)

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L85)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`register`](Behaviour.md#register)
