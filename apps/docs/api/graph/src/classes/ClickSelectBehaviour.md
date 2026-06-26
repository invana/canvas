# Class: ClickSelectBehaviour

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:192](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L192)

## Extends

- `Behaviour`

## Constructors

### Constructor

> **new ClickSelectBehaviour**(`opts`): `ClickSelectBehaviour`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:236](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L236)

#### Parameters

##### opts

[`ClickSelectBehaviourOptions`](../interfaces/ClickSelectBehaviourOptions.md)

#### Returns

`ClickSelectBehaviour`

#### Overrides

`Behaviour.constructor`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

Defined in: canvas/dist/index.d.ts:750

#### Inherited from

`Behaviour._enabled`

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:751

#### Inherited from

`Behaviour.ctx`

***

### events

> `readonly` **events**: `EventEmitter`\<[`ClickSelectEventMap`](../type-aliases/ClickSelectEventMap.md)\>

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:198](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L198)

Selection event bus. Subscribe to `'selection:change'` for a reactive
snapshot every time the selection set is replaced. Independent of (and
additive to) the `onSelectionChange` option.

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:742

#### Inherited from

`Behaviour.id`

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

Defined in: canvas/dist/index.d.ts:749

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

`Behaviour.scope`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:744

#### Inherited from

`Behaviour.shortcuts`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:743

#### Inherited from

`Behaviour.targetLayerId`

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: canvas/dist/index.d.ts:753

##### Returns

`boolean`

#### Inherited from

`Behaviour.enabled`

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

`Behaviour.isEnabled`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

Defined in: canvas/dist/index.d.ts:754

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

#### Inherited from

`Behaviour.isRegistered`

***

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`ResolvedOptions`\>

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:355](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L355)

Resolved current options (read-only snapshot).

##### Returns

`Readonly`\<`ResolvedOptions`\>

## Methods

### addToSelection()

> **addToSelection**(`id`, `type?`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:405](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L405)

Add a single element to the current selection.

#### Parameters

##### id

`string`

##### type?

[`HoverableElementType`](../type-aliases/HoverableElementType.md) = `'shape'`

#### Returns

`void`

***

### clearSelection()

> **clearSelection**(): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:451](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L451)

Clear the entire selection and any dimming.

#### Returns

`void`

***

### deselect()

> **deselect**(`id`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:413](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L413)

Remove a single element from the current selection.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: canvas/dist/index.d.ts:758

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

`Behaviour.destroy`

***

### disable()

> **disable**(): `void`

Defined in: canvas/dist/index.d.ts:760

#### Returns

`void`

#### Inherited from

`Behaviour.disable`

***

### enable()

> **enable**(): `void`

Defined in: canvas/dist/index.d.ts:759

#### Returns

`void`

#### Inherited from

`Behaviour.enable`

***

### getSelectedConnectorIds()

> **getSelectedConnectorIds**(): `string`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:444](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L444)

Currently selected connector (edge) ids.

#### Returns

`string`[]

***

### getSelectedIds()

> **getSelectedIds**(): `string`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:432](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L432)

All currently selected ids (seeds + expanded).

#### Returns

`string`[]

***

### getSelectedShapeIds()

> **getSelectedShapeIds**(): `string`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:437](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L437)

Currently selected shape (node) ids.

#### Returns

`string`[]

***

### isSelected()

> **isSelected**(`id`): `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:427](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L427)

True iff `id` is part of the rendered selection (seed or expanded).

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:340](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L340)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

`Behaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:348](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L348)

Hook fired on disable.

#### Returns

`void`

#### Overrides

`Behaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: canvas/dist/index.d.ts:766

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Inherited from

`Behaviour.onEnable`

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:243](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L243)

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`Behaviour.onRegister`

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

`Behaviour.register`

***

### select()

> **select**(`id`, `type?`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:393](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L393)

Replace the selection with a single element.

#### Parameters

##### id

`string`

##### type?

[`HoverableElementType`](../type-aliases/HoverableElementType.md) = `'shape'`

#### Returns

`void`

***

### selectAll()

> **selectAll**(): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:461](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L461)

Select every node and edge on the target layer. Replaces the current
selection. No-op if the layer isn't mounted.

#### Returns

`void`

***

### selectMultiple()

> **selectMultiple**(`elements`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:398](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L398)

Replace the selection with the given (id, type) pairs.

#### Parameters

##### elements

`object`[]

#### Returns

`void`

***

### selectNeighbourhood()

> **selectNeighbourhood**(`id`, `dir?`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:478](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L478)

Select a node together with its neighbours (in the given direction) and the
edges incident to it. Replaces the current selection. No-op if the layer
isn't mounted.

#### Parameters

##### id

`string`

Seed node id.

##### dir?

`"both"` \| `"in"` \| `"out"`

Adjacency direction for neighbours + incident edges. Default `'both'`.

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:363](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L363)

Runtime option update. State-affecting changes clear the current
visual selection and re-apply with the new options.

#### Parameters

##### patch

`Partial`\<[`ClickSelectBehaviourOptions`](../interfaces/ClickSelectBehaviourOptions.md)\>

#### Returns

`void`

***

### toggle()

> **toggle**(`id`, `type?`): `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:421](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L421)

Toggle the membership of `id` in the selection.

#### Parameters

##### id

`string`

##### type?

[`HoverableElementType`](../type-aliases/HoverableElementType.md) = `'shape'`

#### Returns

`void`
