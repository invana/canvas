# Class: BehaviourRegistry

## Constructors

### Constructor

> **new BehaviourRegistry**(`opts`): `BehaviourRegistry`

#### Parameters

##### opts

[`BehaviourRegistryOptions`](../interfaces/BehaviourRegistryOptions.md)

#### Returns

`BehaviourRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Tear down all behaviours. Called on Canvas destroy.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

#### Type Parameters

##### T

`T` *extends* [`IBehaviour`](../interfaces/IBehaviour.md) = [`IBehaviour`](../interfaces/IBehaviour.md)

#### Parameters

##### id

`string`

#### Returns

`T`

***

### has()

> **has**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

#### Returns

readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

***

### register()

> **register**(`behaviour`): `void`

Register a Behaviour. Wires it (`behaviour.register(ctx)` + events) now if
the Canvas is initialised; otherwise it's stored and wired later by
`registerAll()` (called by `Canvas.init`). Throws on duplicate id.

#### Parameters

##### behaviour

[`IBehaviour`](../interfaces/IBehaviour.md)

#### Returns

`void`

***

### registerAll()

> **registerAll**(): `void`

Wire every not-yet-registered behaviour. Called by `Canvas.init` (after layers mount).

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`id`, `enabled`): `void`

Enable / disable a behaviour. Fires the corresponding bus event.

#### Parameters

##### id

`string`

##### enabled

`boolean`

#### Returns

`void`

***

### unregister()

> **unregister**(`id`): `void`

Remove a behaviour. Calls `destroy()`. No-op if not registered.

#### Parameters

##### id

`string`

#### Returns

`void`
