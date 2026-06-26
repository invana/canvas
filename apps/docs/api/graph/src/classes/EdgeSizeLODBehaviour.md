# Class: EdgeSizeLODBehaviour

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L72)

## Extends

- `ElementSizeLODBehaviour`

## Constructors

### Constructor

> **new EdgeSizeLODBehaviour**(`opts`): `EdgeSizeLODBehaviour`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L76)

#### Parameters

##### opts

[`EdgeSizeLODBehaviourOptions`](../interfaces/EdgeSizeLODBehaviourOptions.md)

#### Returns

`EdgeSizeLODBehaviour`

#### Overrides

`ElementSizeLODBehaviour.constructor`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: canvas/dist/index.d.ts:750

#### Inherited from

`ElementSizeLODBehaviour._enabled`

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:751

#### Inherited from

`ElementSizeLODBehaviour.ctx`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:742

#### Inherited from

`ElementSizeLODBehaviour.id`

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: canvas/dist/index.d.ts:749

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

`ElementSizeLODBehaviour.scope`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:744

#### Inherited from

`ElementSizeLODBehaviour.shortcuts`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:743

#### Inherited from

`ElementSizeLODBehaviour.targetLayerId`

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: canvas/dist/index.d.ts:753

##### Returns

`boolean`

#### Inherited from

`ElementSizeLODBehaviour.enabled`

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Defined in: canvas/dist/index.d.ts:773

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

`ElementSizeLODBehaviour.isEnabled`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

Defined in: canvas/dist/index.d.ts:754

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

#### Inherited from

`ElementSizeLODBehaviour.isRegistered`

## Methods

### apply()

> `protected` **apply**(`rawScale`): `void`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L111)

Per-zoom-frame apply: write the screen-px / world-px ratio to every
managed edge as a render-time stroke multiplier. The renderer's draw
pipeline reads `inst.strokeWidthScale` and multiplies it into the
spec's `stroke.width` at draw time, so state-config strokes (e.g.
`active: { strokeWidth: 1.5 }`) are interpreted in the same screen-px
unit the layer's "live" strokes are interpreted in — no LOD-loss
across a `GraphLayer.rerenderEdge` rebuild, and no inversion of the
caller's intent.

The strokeWidthPx config field is unused under this model — every
spec width is treated as the target screen-px. Kept on the type for
back-compat; a future revision may remove it.

#### Parameters

##### rawScale

`number`

#### Returns

`void`

#### Overrides

`ElementSizeLODBehaviour.apply`

***

### destroy()

> **destroy**(): `void`

Defined in: canvas/dist/index.d.ts:758

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.destroy`

***

### disable()

> **disable**(): `void`

Defined in: canvas/dist/index.d.ts:760

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.disable`

***

### enable()

> **enable**(): `void`

Defined in: canvas/dist/index.d.ts:759

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.enable`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: canvas/dist/index.d.ts:1737

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: canvas/dist/index.d.ts:1739

Hook fired on disable.

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: canvas/dist/index.d.ts:1738

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.onEnable`

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:1736

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.onRegister`

***

### onReleaseTargets()

> `protected` **onReleaseTargets**(): `void`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L93)

Optional teardown hook — drop layer refs / caches. Default no-op.

#### Returns

`void`

#### Overrides

`ElementSizeLODBehaviour.onReleaseTargets`

***

### onResolveTargets()

> `protected` **onResolveTargets**(`ctx`): `void`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:81](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L81)

Called once on register. Resolve layer references from `ctx.layers`
and stash them on `this` for later `apply` calls. Throw a descriptive
error if a required layer isn't present — the canvas guarantees
`ctx.layers` is fully populated before behaviours register.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`ElementSizeLODBehaviour.onResolveTargets`

***

### reflow()

> **reflow**(): `void`

Defined in: canvas/dist/index.d.ts:1748

Force an immediate reflow at the current camera scale. Useful after
tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
reads from) — push the new sizes without waiting for the next zoom.

Bypasses the epsilon skip and the settle debounce — explicit calls
are always treated as "apply now."

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.reflow`

***

### register()

> **register**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:756

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`ElementSizeLODBehaviour.register`
