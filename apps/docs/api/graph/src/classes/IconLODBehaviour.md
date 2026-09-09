# Class: IconLODBehaviour

## Extends

- `ContentLODBehaviour`

## Constructors

### Constructor

> **new IconLODBehaviour**(`opts`): `IconLODBehaviour`

#### Parameters

##### opts

[`ContentLODBehaviourOptions`](../interfaces/ContentLODBehaviourOptions.md)

#### Returns

`IconLODBehaviour`

#### Inherited from

`ContentLODBehaviour.constructor`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

#### Inherited from

`ContentLODBehaviour._enabled`

***

### \_options

> `protected` **\_options**: [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

The construction options, merged in-place by [setOptions](#setoptions). Named
`_options` (not `options`) so subclasses that expose a bespoke
`get options()` snapshot don't collide with it. Subclasses read their live
config from here (or from fields re-synced in [onOptionsChanged](#onoptionschanged)).

#### Inherited from

`ContentLODBehaviour._options`

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`ContentLODBehaviour.ctx`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`ContentLODBehaviour.id`

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
`'wheel-zoom'`). Distinct from [id](EdgeLODBehaviour.md#id) (the per-instance key): all
`DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Inherited from

`ContentLODBehaviour.kind`

***

### layer

> `protected` **layer**: [`GraphLayer`](GraphLayer.md) = `null`

Bound target layer — resolved in `onRegister`.

#### Inherited from

`ContentLODBehaviour.layer`

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

`ContentLODBehaviour.scope`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

#### Inherited from

`ContentLODBehaviour.shortcuts`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

#### Inherited from

`ContentLODBehaviour.targetLayerId`

## Accessors

### band$

#### Get Signature

> **get** **band$**(): `Readonly`\<[`ZoomBand`](../interfaces/ZoomBand.md)\>

Read-only snapshot of the active zoom band.

##### Returns

`Readonly`\<[`ZoomBand`](../interfaces/ZoomBand.md)\>

#### Inherited from

`ContentLODBehaviour.band$`

***

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.enabled`

***

### hasGestureClaim

#### Get Signature

> **get** `protected` **hasGestureClaim**(): `boolean`

Does this behaviour currently hold the gesture?

##### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.hasGestureClaim`

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.isEnabled`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.isRegistered`

## Methods

### claimGesture()

> `protected` **claimGesture**(`opts?`): `boolean`

Take exclusive ownership of the pointer gesture for the duration of a drag
(`ctx.gestures`, see `input/GestureArbiter.ts`). Returns `false` when
another behaviour already owns it — the caller must then **not** start its
gesture, because two behaviours steering the same pointer is exactly what
the arbiter exists to prevent.

Claiming also suspends camera panning: `DragPanBehaviour` watches the
arbiter and yields while anybody else owns the gesture. That replaces the
old `camera.viewport.plugins.pause('drag')` reach-through, which put a
`pixi-viewport` internal in the hands of domain behaviours.

Pair every successful claim with [releaseGesture](#releasegesture) on **every** exit
path — pointerup, pointercancel, abort. `disable()` and `destroy()` release
automatically as a backstop.

#### Parameters

##### opts?

[`GestureClaimOptions`](../../../canvas/src/interfaces/GestureClaimOptions.md)

#### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.claimGesture`

***

### destroy()

> **destroy**(): `void`

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.destroy`

***

### disable()

> **disable**(): `void`

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.disable`

***

### enable()

> **enable**(): `void`

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.enable`

***

### getOptions()

> **getOptions**(): `Readonly`\<`TOptions`\>

Snapshot of the current (merged) options — seeds a settings editor.

#### Returns

`Readonly`\<`TOptions`\>

#### Inherited from

`ContentLODBehaviour.getOptions`

***

### isNodeExempt()

> `protected` **isNodeExempt**(`_id`): `boolean`

Override hook — nodes whose content stays visible **even when the band would
hide it** (e.g. always-show the most central nodes' labels). Default: no
exemptions. Consulted only while the band is hiding, so it never over-hides.

#### Parameters

##### \_id

`string`

#### Returns

`boolean`

#### Inherited from

`ContentLODBehaviour.isNodeExempt`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Hook fired on disable.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.onEnable`

***

### onOptionsChanged()

> `protected` **onOptionsChanged**(`_changes`): `void`

Hook fired after [setOptions](#setoptions) merges a patch (and after any `enabled`
toggle is applied). Default no-op. Override to apply an option change live:
a behaviour whose effect is wired in [onEnable](#onenable) (a pixi-viewport
plugin, a DOM listener) re-arms here; one that caches option values in
fields re-syncs them from `this._options` here. `changes` is the raw patch;
`this._options` already holds the merged result.

#### Parameters

##### \_changes

`Partial`\<`TOptions`\>

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.onOptionsChanged`

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.onRegister`

***

### reArm()

> `protected` **reArm**(): `void`

Re-run [onDisable](#ondisable) then [onEnable](#onenable) when the behaviour is live, so
an option change wired at enable-time (a pixi-viewport plugin, a listener
bound with the old config) picks up `this._options`. No-op when disabled or
unregistered (the next [onEnable](#onenable) will read the fresh options anyway).
The idiomatic body of an [onOptionsChanged](#onoptionschanged) override for such
behaviours.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.reArm`

***

### refreshExemptions()

> `protected` **refreshExemptions**(): `void`

Override hook — recompute the exemption set. Called before every **full**
sweep (data change / enable / `setOptions`), so an exemption derived from
topology (degree centrality) stays current, while zoom-only reflows skip it.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.refreshExemptions`

***

### register()

> **register**(`ctx`): `void`

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.register`

***

### releaseGesture()

> `protected` **releaseGesture**(): `void`

End this behaviour's gesture claim. Safe to call any number of times and
when no claim is held — the arbiter identifies claims by token, so a stale
release can never evict a later owner.

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.releaseGesture`

***

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Contribute this behaviour's serialisable config to a canvas-state snapshot
(the engine's `DefinitionSerializable` contract). The base implementation
captures the explicit `enabled` flag (rule 7). Subclasses with additional
JSON-serialisable options should override and spread `super.serializeDefinition()`.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

`ContentLODBehaviour.serializeDefinition`

***

### setContentVisible()

> `protected` **setContentVisible**(`renderer`, `id`, `visible`): `void`

Show / hide this behaviour's content kind on one node. Subclasses route to
the matching renderer toggle (`setShapeTextVisible` / `…Icon…` / `…Image…`).

#### Parameters

##### renderer

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md)

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

#### Overrides

`ContentLODBehaviour.setContentVisible`

***

### setOptions()

> **setOptions**(`patch`): `void`

Runtime option update — re-applies immediately (a full sweep) if enabled.

#### Parameters

##### patch

`Partial`\<[`ContentLODBehaviourOptions`](../interfaces/ContentLODBehaviourOptions.md)\>

#### Returns

`void`

#### Inherited from

`ContentLODBehaviour.setOptions`
