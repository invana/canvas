# Class: ClickViewBehaviour

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L60)

## Extends

- `Behaviour`

## Constructors

### Constructor

> **new ClickViewBehaviour**(`opts`): `ClickViewBehaviour`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L87)

#### Parameters

##### opts

[`ClickViewBehaviourOptions`](../interfaces/ClickViewBehaviourOptions.md)

#### Returns

`ClickViewBehaviour`

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

### events

> `readonly` **events**: `EventEmitter`\<[`ClickViewEventMap`](../type-aliases/ClickViewEventMap.md)\>

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L65)

View event bus. Subscribe to `'view:change'` for the current single target
(or `null`) every time it changes.

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

## Methods

### clear()

> **clear**(): `void`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:211](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L211)

Clear the viewed element.

#### Returns

`void`

***

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

### getTarget()

> **getTarget**(): [`ViewTarget`](../interfaces/ViewTarget.md)

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:193](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L193)

The element currently targeted for viewing, or `null`.

#### Returns

[`ViewTarget`](../interfaces/ViewTarget.md)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:179](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L179)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

`Behaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:186](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L186)

Hook fired on disable.

#### Returns

`void`

#### Overrides

`Behaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: canvas/dist/index.d.ts:766

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Inherited from

`Behaviour.onEnable`

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L94)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`Behaviour.onRegister`

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

### setTarget()

> **setTarget**(`target`): `void`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:198](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L198)

Set the viewed element explicitly (e.g. from a context menu).

#### Parameters

##### target

[`ViewTarget`](../interfaces/ViewTarget.md)

#### Returns

`void`
