# Interface: IBehaviour

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:23](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L23)

What `BehaviourRegistry` sees.

## Properties

### enabled

> `readonly` **enabled**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:25](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L25)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:24](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L24)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:27](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L27)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:26](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L26)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:28](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L28)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:30](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L30)

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:32](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L32)

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:31](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L31)

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:29](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/behaviours/Behaviour.ts#L29)

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`
