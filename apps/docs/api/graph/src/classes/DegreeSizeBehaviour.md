# Class: DegreeSizeBehaviour

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:155](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L155)

## Extends

- `Behaviour`

## Constructors

### Constructor

> **new DegreeSizeBehaviour**(`opts`): `DegreeSizeBehaviour`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:178](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L178)

#### Parameters

##### opts

[`DegreeSizeBehaviourOptions`](../interfaces/DegreeSizeBehaviourOptions.md)

#### Returns

`DegreeSizeBehaviour`

#### Overrides

`Behaviour.constructor`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: canvas/dist/index.d.ts:750

#### Inherited from

`Behaviour._enabled`

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:751

#### Inherited from

`Behaviour.ctx`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:742

#### Inherited from

`Behaviour.id`

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: canvas/dist/index.d.ts:749

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

`Behaviour.scope`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:744

#### Inherited from

`Behaviour.shortcuts`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:743

#### Inherited from

`Behaviour.targetLayerId`

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: canvas/dist/index.d.ts:753

##### Returns

`boolean`

#### Inherited from

`Behaviour.enabled`

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: canvas/dist/index.d.ts:773

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

`Behaviour.isEnabled`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

Defined in: canvas/dist/index.d.ts:754

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

#### Inherited from

`Behaviour.isRegistered`

***

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`ResolvedOptions`\>

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:230](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L230)

Read-only snapshot of resolved options.

##### Returns

`Readonly`\<`ResolvedOptions`\>

## Methods

### destroy()

> **destroy**(): `void`

Defined in: canvas/dist/index.d.ts:758

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

`Behaviour.destroy`

***

### disable()

> **disable**(): `void`

Defined in: canvas/dist/index.d.ts:760

#### Returns

`void`

#### Inherited from

`Behaviour.disable`

***

### enable()

> **enable**(): `void`

Defined in: canvas/dist/index.d.ts:759

#### Returns

`void`

#### Inherited from

`Behaviour.enable`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:218](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L218)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

`Behaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:214](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L214)

Hook fired on disable.

#### Returns

`void`

#### Overrides

`Behaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:209](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L209)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

`Behaviour.onEnable`

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:185](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L185)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`Behaviour.onRegister`

***

### recompute()

> **recompute**(): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:248](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L248)

Force a recompute + write pass. Useful after a bulk `store.batch()`
the caller wants reflected immediately (the microtask-debounced
subscription would otherwise fire on the next tick).

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:756

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`Behaviour.register`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:238](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L238)

Runtime option update. Re-runs `applyAll()` immediately if enabled so
GUI slider changes are visible without an extra call.

#### Parameters

##### patch

`Partial`\<[`DegreeSizeBehaviourOptions`](../interfaces/DegreeSizeBehaviourOptions.md)\>

#### Returns

`void`
