# Class: HoverElementPreviewBehaviour

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:422](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L422)

## Extends

- `Behaviour`

## Constructors

### Constructor

> **new HoverElementPreviewBehaviour**(`opts`): `HoverElementPreviewBehaviour`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:450](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L450)

#### Parameters

##### opts

[`HoverElementPreviewBehaviourOptions`](../interfaces/HoverElementPreviewBehaviourOptions.md)

#### Returns

`HoverElementPreviewBehaviour`

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

> `readonly` **events**: `EventEmitter`\<[`HoverElementPreviewEventMap`](../type-aliases/HoverElementPreviewEventMap.md)\>

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:427](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L427)

Preview event bus. Subscribe to `'preview:show'` / `'preview:move'` /
`'preview:hide'` to render and position the card.

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

### current

#### Get Signature

> **get** **current**(): [`PreviewSnapshot`](../type-aliases/PreviewSnapshot.md)\<`unknown`, `unknown`\>

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:542](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L542)

The snapshot currently shown, or `null`.

##### Returns

[`PreviewSnapshot`](../type-aliases/PreviewSnapshot.md)\<`unknown`, `unknown`\>

***

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

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:547](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L547)

Read-only snapshot of resolved options.

##### Returns

`Readonly`\<`ResolvedOptions`\>

## Methods

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

### hide()

> **hide**(): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:581](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L581)

Force the card to hide (cancels any pending dwell).

#### Returns

`void`

***

### holdOpen()

> **holdOpen**(): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:590](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L590)

Keep the card open — cancels the pending close timer. Call from the card's
`pointerenter` in [HoverElementPreviewBehaviourOptions.interactive](../interfaces/HoverElementPreviewBehaviourOptions.md#interactive) mode so
the pointer can rest on the card (to select text / click) without it hiding.

#### Returns

`void`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:528](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L528)

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

`Behaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:535](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L535)

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

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:457](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L457)

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

### releaseHold()

> **releaseHold**(): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:599](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L599)

Release a [holdOpen](#holdopen) — restart the `closeDelay` grace timer. Call from
the card's `pointerleave` so it hides once the pointer leaves the card.

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:555](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L555)

Runtime option update. A `card` / `placement` change re-resolves any
in-flight card so the next paint reflects it immediately.

#### Parameters

##### patch

`Partial`\<[`HoverElementPreviewBehaviourOptions`](../interfaces/HoverElementPreviewBehaviourOptions.md)\>

#### Returns

`void`
