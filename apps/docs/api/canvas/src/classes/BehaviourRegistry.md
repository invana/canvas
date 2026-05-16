# Class: BehaviourRegistry

Defined in: [canvas/src/registries/BehaviourRegistry.ts:25](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L25)

## Constructors

### Constructor

> **new BehaviourRegistry**(`opts`): `BehaviourRegistry`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:30](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L30)

#### Parameters

##### opts

[`BehaviourRegistryOptions`](../interfaces/BehaviourRegistryOptions.md)

#### Returns

`BehaviourRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:35](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L35)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:101](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L101)

Tear down all behaviours. Called on Canvas destroy.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:88](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L88)

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

Defined in: [canvas/src/registries/BehaviourRegistry.ts:92](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L92)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

Defined in: [canvas/src/registries/BehaviourRegistry.ts:96](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L96)

#### Returns

readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

***

### register()

> **register**(`behaviour`): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:47](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L47)

Register a Behaviour. Calls `behaviour.register(ctx)` + fires
`'behaviour:registered'`. If `behaviour.enabled` is `true` at construction
time (the developer opted in via `enabled: true` option), also fires
`'behaviour:enabled'` and runs the conflict-warning check.

Throws on duplicate id.

#### Parameters

##### behaviour

[`IBehaviour`](../interfaces/IBehaviour.md)

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`id`, `enabled`): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:74](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L74)

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

Defined in: [canvas/src/registries/BehaviourRegistry.ts:62](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/BehaviourRegistry.ts#L62)

Remove a behaviour. Calls `destroy()`. No-op if not registered.

#### Parameters

##### id

`string`

#### Returns

`void`
