# Interface: IBehaviour

What `BehaviourRegistry` sees.

## Properties

### enabled

> `readonly` **enabled**: `boolean`

***

### id

> `readonly` **id**: `string`

***

### isRegistered

> `readonly` **isRegistered**: `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

***

### disable()

> **disable**(): `void`

#### Returns

`void`

***

### enable()

> **enable**(): `void`

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`

***

### setOptions()

> **setOptions**(`changes`): `void`

Merge a serialisable options patch and apply it live. Every behaviour
supports this (the base provides a generic implementation) so the engine's
`canvas.update({ behaviours })` path can retune any behaviour uniformly.

#### Parameters

##### changes

`Record`\<`string`, `unknown`\>

#### Returns

`void`
