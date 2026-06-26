# Class: BehaviourRegistry

Defined in: [canvas/src/registries/BehaviourRegistry.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L25)

## Constructors

### Constructor

> **new BehaviourRegistry**(`opts`): `BehaviourRegistry`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L30)

#### Parameters

##### opts

[`BehaviourRegistryOptions`](../interfaces/BehaviourRegistryOptions.md)

#### Returns

`BehaviourRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L35)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:112](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L112)

Tear down all behaviours. Called on Canvas destroy.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L99)

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

Defined in: [canvas/src/registries/BehaviourRegistry.ts:103](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L103)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

Defined in: [canvas/src/registries/BehaviourRegistry.ts:107](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L107)

#### Returns

readonly [`IBehaviour`](../interfaces/IBehaviour.md)[]

***

### register()

> **register**(`behaviour`): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L44)

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

Defined in: [canvas/src/registries/BehaviourRegistry.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L54)

Wire every not-yet-registered behaviour. Called by `Canvas.init` (after layers mount).

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`id`, `enabled`): `void`

Defined in: [canvas/src/registries/BehaviourRegistry.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L85)

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

Defined in: [canvas/src/registries/BehaviourRegistry.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/BehaviourRegistry.ts#L73)

Remove a behaviour. Calls `destroy()`. No-op if not registered.

#### Parameters

##### id

`string`

#### Returns

`void`
