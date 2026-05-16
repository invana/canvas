# Abstract Class: Behaviour

Defined in: [canvas/src/behaviours/Behaviour.ts:52](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L52)

What `BehaviourRegistry` sees.

## Extended by

- [`DragPanBehaviour`](DragPanBehaviour.md)
- [`DragShapeBehaviour`](DragShapeBehaviour.md)
- [`WheelZoomBehaviour`](WheelZoomBehaviour.md)
- [`PinchZoomBehaviour`](PinchZoomBehaviour.md)
- [`KeyboardCameraInputBehaviour`](KeyboardCameraInputBehaviour.md)
- [`ElementSizeLODBehaviour`](ElementSizeLODBehaviour.md)
- [`HoverActivateBehaviour`](../../../graph/src/classes/HoverActivateBehaviour.md)
- [`ClickSelectBehaviour`](../../../graph/src/classes/ClickSelectBehaviour.md)
- [`BrushSelectBehaviour`](../../../graph/src/classes/BrushSelectBehaviour.md)
- [`LassoSelectBehaviour`](../../../graph/src/classes/LassoSelectBehaviour.md)
- [`DragNodeBehaviour`](../../../graph/src/classes/DragNodeBehaviour.md)
- [`LabelCollisionBehaviour`](../../../graph/src/classes/LabelCollisionBehaviour.md)
- [`LabelResolutionLODBehaviour`](../../../graph/src/classes/LabelResolutionLODBehaviour.md)

## Implements

- [`IBehaviour`](../interfaces/IBehaviour.md)

## Constructors

### Constructor

> **new Behaviour**(`opts`): `Behaviour`

Defined in: [canvas/src/behaviours/Behaviour.ts:66](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L66)

#### Parameters

##### opts

[`BehaviourOptions`](../interfaces/BehaviourOptions.md)

#### Returns

`Behaviour`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L63)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:64](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L64)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:53](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L53)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`id`](../interfaces/IBehaviour.md#id)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L54)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`layerId`](../interfaces/IBehaviour.md#layerid)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:61](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L61)

`'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`scope`](../interfaces/IBehaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`shortcuts`](../interfaces/IBehaviour.md#shortcuts)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:74](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L74)

##### Returns

`boolean`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enabled`](../interfaces/IBehaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:133](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L133)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:89](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L89)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`destroy`](../interfaces/IBehaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`disable`](../interfaces/IBehaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:97](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L97)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enable`](../interfaces/IBehaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(`_ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:115](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L115)

Cleanup on destroy. Default no-op.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:125](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L125)

Hook fired on disable.

#### Returns

`void`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:120](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L120)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

***

### onRegister()

> `abstract` `protected` **onRegister**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:112](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L112)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:79](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L79)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`register`](../interfaces/IBehaviour.md#register)
