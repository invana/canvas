# Class: LabelCollisionBehaviour

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:96](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L96)

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](../../../canvas/src/classes/Behaviour.md)

## Constructors

### Constructor

> **new LabelCollisionBehaviour**(`opts`): `LabelCollisionBehaviour`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:111](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L111)

#### Parameters

##### opts

[`LabelCollisionBehaviourOptions`](../interfaces/LabelCollisionBehaviourOptions.md)

#### Returns

`LabelCollisionBehaviour`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`constructor`](../../../canvas/src/classes/Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L63)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`_enabled`](../../../canvas/src/classes/Behaviour.md#_enabled)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:64](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L64)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`ctx`](../../../canvas/src/classes/Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:53](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L53)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`id`](../../../canvas/src/classes/Behaviour.md#id)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L54)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`layerId`](../../../canvas/src/classes/Behaviour.md#layerid)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:61](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L61)

`'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`scope`](../../../canvas/src/classes/Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`shortcuts`](../../../canvas/src/classes/Behaviour.md#shortcuts)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:74](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L74)

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`enabled`](../../../canvas/src/classes/Behaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:133](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L133)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`isEnabled`](../../../canvas/src/classes/Behaviour.md#isenabled)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:89](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L89)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`destroy`](../../../canvas/src/classes/Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`disable`](../../../canvas/src/classes/Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:97](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L97)

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`enable`](../../../canvas/src/classes/Behaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:151](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L151)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onDestroy`](../../../canvas/src/classes/Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:163](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L163)

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onDisable`](../../../canvas/src/classes/Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:159](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L159)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onEnable`](../../../canvas/src/classes/Behaviour.md#onenable)

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:122](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L122)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onRegister`](../../../canvas/src/classes/Behaviour.md#onregister)

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:79](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L79)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`register`](../../../canvas/src/classes/Behaviour.md#register)
