# Class: NodeSizeLODBehaviour

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:128](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L128)

What `BehaviourRegistry` sees.

## Extends

- [`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md)

## Constructors

### Constructor

> **new NodeSizeLODBehaviour**(`opts`): `NodeSizeLODBehaviour`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:140](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L140)

#### Parameters

##### opts

[`NodeSizeLODBehaviourOptions`](../interfaces/NodeSizeLODBehaviourOptions.md)

#### Returns

`NodeSizeLODBehaviour`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`constructor`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:63](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L63)

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`_enabled`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#_enabled)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/behaviours/Behaviour.ts:64](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L64)

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`ctx`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:53](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L53)

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`id`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#id)

***

### layerId?

> `readonly` `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:54](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L54)

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`layerId`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#layerid)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: [canvas/src/behaviours/Behaviour.ts:61](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L61)

`'layer'` if `layerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`scope`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:55](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L55)

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`shortcuts`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#shortcuts)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:74](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L74)

##### Returns

`boolean`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`enabled`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#enabled)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:133](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L133)

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`isEnabled`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#isenabled)

## Methods

### apply()

> `protected` **apply**(`rawScale`): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:178](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L178)

Per-frame fast path. Sets `gfx.scale = 1 / cameraScale` on every node
via the renderer's transform fast path — no geometry rebuild. The
spec was pre-set to "target-px values treated as world units" by
writeBaseline at enable / reflow time, so:

    on-screen = nativeWorldSize × cameraScale × gfxScale
              = (sizePx / 1)    × cameraScale × (1 / cameraScale)
              = sizePx ✓

Stroke width scales with the body (Pixi's stroke is in local units)
— which is precisely the pixel-constant intent.

#### Parameters

##### rawScale

`number`

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`apply`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#apply)

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:89](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L89)

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`destroy`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#destroy)

***

### disable()

> **disable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:103](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L103)

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`disable`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#disable)

***

### enable()

> **enable**(): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:97](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L97)

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`enable`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#enable)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:118](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L118)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onDestroy`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:241](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L241)

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onDisable`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:231](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L231)

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onEnable`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#onenable)

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:110](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L110)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onRegister`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#onregister)

***

### onReleaseTargets()

> `protected` **onReleaseTargets**(): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:157](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L157)

Optional teardown hook — drop layer refs / caches. Default no-op.

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onReleaseTargets`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#onreleasetargets)

***

### onResolveTargets()

> `protected` **onResolveTargets**(`ctx`): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:145](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L145)

Called once on register. Resolve layer references from `ctx.layers`
and stash them on `this` for later `apply` calls. Throw a descriptive
error if a required layer isn't present — the canvas guarantees
`ctx.layers` is fully populated before behaviours register.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`onResolveTargets`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#onresolvetargets)

***

### reflow()

> **reflow**(): `void`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:251](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L251)

Force an immediate reflow at the current camera scale. Useful after
tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
reads from) — push the new sizes without waiting for the next zoom.

Bypasses the epsilon skip and the settle debounce — explicit calls
are always treated as "apply now."

#### Returns

`void`

#### Overrides

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`reflow`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#reflow)

***

### register()

> **register**(`ctx`): `void`

Defined in: [canvas/src/behaviours/Behaviour.ts:79](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L79)

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`ElementSizeLODBehaviour`](../../../canvas/src/classes/ElementSizeLODBehaviour.md).[`register`](../../../canvas/src/classes/ElementSizeLODBehaviour.md#register)
