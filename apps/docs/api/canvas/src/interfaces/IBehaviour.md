# Interface: IBehaviour

Defined in: [canvas/src/behaviours/Behaviour.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L23)

What `BehaviourRegistry` sees.

## Properties

### enabled

> `readonly` **enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L25)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L24)

***

### isRegistered

> `readonly` **isRegistered**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L27)

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L28)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L30)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L29)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L32)

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L34)

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L33)

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L31)

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`
