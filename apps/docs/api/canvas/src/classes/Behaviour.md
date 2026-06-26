# Abstract Class: Behaviour

Defined in: [canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L54)

What `BehaviourRegistry` sees.

## Extended by

- [`DragPanBehaviour`](DragPanBehaviour.md)
- [`DragShapeBehaviour`](DragShapeBehaviour.md)
- [`WheelZoomBehaviour`](WheelZoomBehaviour.md)
- [`PinchZoomBehaviour`](PinchZoomBehaviour.md)
- [`KeyboardCameraInputBehaviour`](KeyboardCameraInputBehaviour.md)
- [`ElementSizeLODBehaviour`](ElementSizeLODBehaviour.md)

## Implements

- [`IBehaviour`](../interfaces/IBehaviour.md)

## Constructors

### Constructor

> **new Behaviour**(`opts`): `Behaviour`

Defined in: [canvas/src/behaviours/Behaviour.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L68)

#### Parameters

##### opts

[`BehaviourOptions`](../interfaces/BehaviourOptions.md)

#### Returns

`Behaviour`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L65)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L66)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`id`](../interfaces/IBehaviour.md#id)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L63)

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`scope`](../interfaces/IBehaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L57)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`shortcuts`](../interfaces/IBehaviour.md#shortcuts)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L56)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`targetLayerId`](../interfaces/IBehaviour.md#targetlayerid)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L76)

##### Returns

`boolean`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enabled`](../interfaces/IBehaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L139)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L80)

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`isRegistered`](../interfaces/IBehaviour.md#isregistered)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:95](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L95)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`destroy`](../interfaces/IBehaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:109](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L109)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`disable`](../interfaces/IBehaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enable`](../interfaces/IBehaviour.md#enable)

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

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:131](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L131)

Hook fired on disable.

#### Returns

`void`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:126](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L126)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

***

### onRegister()

> `abstract` `protected` **onRegister**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L118)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

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

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`register`](../interfaces/IBehaviour.md#register)
