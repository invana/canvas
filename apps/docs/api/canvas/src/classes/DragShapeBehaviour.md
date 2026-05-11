# Class: DragShapeBehaviour

Defined in: [packages/canvas/src/behaviours/DragShapeBehaviour.ts:63](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L63)

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](Behaviour.md)

## Constructors

### Constructor

> **new DragShapeBehaviour**(`opts`): `DragShapeBehaviour`

Defined in: [packages/canvas/src/behaviours/DragShapeBehaviour.ts:75](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L75)

#### Parameters

##### opts

[`DragShapeBehaviourOptions`](../interfaces/DragShapeBehaviourOptions.md)

#### Returns

`DragShapeBehaviour`

#### Overrides

[`Behaviour`](Behaviour.md).[`constructor`](Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L63)

#### Inherited from

[`Behaviour`](Behaviour.md).[`_enabled`](Behaviour.md#_enabled)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:64](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L64)

#### Inherited from

[`Behaviour`](Behaviour.md).[`ctx`](Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:53](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L53)

#### Inherited from

[`Behaviour`](Behaviour.md).[`id`](Behaviour.md#id)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L54)

#### Inherited from

[`Behaviour`](Behaviour.md).[`layerId`](Behaviour.md#layerid)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:61](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L61)

`'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](Behaviour.md).[`scope`](Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Inherited from

[`Behaviour`](Behaviour.md).[`shortcuts`](Behaviour.md#shortcuts)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:74](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L74)

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enabled`](Behaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:133](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L133)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`isEnabled`](Behaviour.md#isenabled)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:89](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L89)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`destroy`](Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`disable`](Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:97](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L97)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enable`](Behaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(`_ctx`): `void`

Defined in: [packages/canvas/src/behaviours/DragShapeBehaviour.ts:103](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L103)

Cleanup on destroy. Default no-op.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDestroy`](Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [packages/canvas/src/behaviours/DragShapeBehaviour.ts:109](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L109)

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDisable`](Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:120](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L120)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`onEnable`](Behaviour.md#onenable)

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [packages/canvas/src/behaviours/DragShapeBehaviour.ts:83](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L83)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onRegister`](Behaviour.md#onregister)

***

### register()

> **register**(`ctx`): `void`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:79](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/behaviours/Behaviour.ts#L79)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`register`](Behaviour.md#register)
