# Abstract Class: ElementScaleLODBehaviour\<TOptions\>

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](Behaviour.md)\<`TOptions`\>

## Type Parameters

### TOptions

`TOptions` *extends* [`ElementScaleLODBehaviourOptions`](../interfaces/ElementScaleLODBehaviourOptions.md) = [`ElementScaleLODBehaviourOptions`](../interfaces/ElementScaleLODBehaviourOptions.md)

## Constructors

### Constructor

> **new ElementScaleLODBehaviour**\<`TOptions`\>(`opts`): `ElementScaleLODBehaviour`\<`TOptions`\>

#### Parameters

##### opts

`TOptions`

#### Returns

`ElementScaleLODBehaviour`\<`TOptions`\>

#### Overrides

[`Behaviour`](Behaviour.md).[`constructor`](Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`_enabled`](Behaviour.md#_enabled)

***

### \_options

> `protected` **\_options**: `TOptions`

The construction options, merged in-place by [setOptions](#setoptions). Named
`_options` (not `options`) so subclasses that expose a bespoke
`get options()` snapshot don't collide with it. Subclasses read their live
config from here (or from fields re-synced in [onOptionsChanged](#onoptionschanged)).

#### Inherited from

[`Behaviour`](Behaviour.md).[`_options`](Behaviour.md#_options)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`Behaviour`](Behaviour.md).[`ctx`](Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`Behaviour`](Behaviour.md).[`id`](Behaviour.md#id)

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
`'wheel-zoom'`). Distinct from [id](../../../graph/src/classes/EdgeLODBehaviour.md#id) (the per-instance key): all
`DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Inherited from

[`Behaviour`](Behaviour.md).[`kind`](Behaviour.md#kind)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](Behaviour.md).[`scope`](Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

#### Inherited from

[`Behaviour`](Behaviour.md).[`shortcuts`](Behaviour.md#shortcuts)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

#### Inherited from

[`Behaviour`](Behaviour.md).[`targetLayerId`](Behaviour.md#targetlayerid)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enabled`](Behaviour.md#enabled)

***

### hasGestureClaim

#### Get Signature

> **get** `protected` **hasGestureClaim**(): `boolean`

Does this behaviour currently hold the gesture?

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`hasGestureClaim`](Behaviour.md#hasgestureclaim)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`isEnabled`](Behaviour.md#isenabled)

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

#### Inherited from

[`Behaviour`](Behaviour.md).[`isRegistered`](Behaviour.md#isregistered)

## Methods

### apply()

> `abstract` `protected` **apply**(`scale`): `void`

Apply rescaling at the given camera scale. Called by `onEnable`,
each `camera:zoom` (RAF coalesced), and by `onDisable` with
`scale = 1` to restore world-unit sizing.

Implementations should be idempotent — calling twice with the same
scale is a no-op visually.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

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

[`GestureClaimOptions`](../interfaces/GestureClaimOptions.md)

#### Returns

`boolean`

#### Inherited from

[`Behaviour`](Behaviour.md).[`claimGesture`](Behaviour.md#claimgesture)

***

### destroy()

> **destroy**(): `void`

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`destroy`](Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`disable`](Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`enable`](Behaviour.md#enable)

***

### getOptions()

> **getOptions**(): `Readonly`\<`TOptions`\>

Snapshot of the current (merged) options — seeds a settings editor.

#### Returns

`Readonly`\<`TOptions`\>

#### Inherited from

[`Behaviour`](Behaviour.md).[`getOptions`](Behaviour.md#getoptions)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDestroy`](Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onDisable`](Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onEnable`](Behaviour.md#onenable)

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

[`Behaviour`](Behaviour.md).[`onOptionsChanged`](Behaviour.md#onoptionschanged)

***

### onRegister()

> `protected` **onRegister**(`ctx`): `void`

Subscribe to events / setup any handler resources.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](Behaviour.md).[`onRegister`](Behaviour.md#onregister)

***

### onReleaseTargets()

> `protected` **onReleaseTargets**(): `void`

Optional teardown hook — drop layer refs / caches. Default no-op.

#### Returns

`void`

***

### onResolveTargets()

> `abstract` `protected` **onResolveTargets**(`ctx`): `void`

Called once on register. Resolve layer references from `ctx.layers`
and stash them on `this` for later `apply` calls. Throw a descriptive
error if a required layer isn't present — the canvas guarantees
`ctx.layers` is fully populated before behaviours register.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

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

[`Behaviour`](Behaviour.md).[`reArm`](Behaviour.md#rearm)

***

### reflow()

> **reflow**(): `void`

Force an immediate reflow at the current camera scale. Useful after
tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
reads from) — push the new sizes without waiting for the next zoom.

Bypasses the epsilon skip and the settle debounce — explicit calls
are always treated as "apply now."

#### Returns

`void`

***

### register()

> **register**(`ctx`): `void`

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`register`](Behaviour.md#register)

***

### releaseGesture()

> `protected` **releaseGesture**(): `void`

End this behaviour's gesture claim. Safe to call any number of times and
when no claim is held — the arbiter identifies claims by token, so a stale
release can never evict a later owner.

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`releaseGesture`](Behaviour.md#releasegesture)

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

[`Behaviour`](Behaviour.md).[`serializeDefinition`](Behaviour.md#serializedefinition)

***

### setOptions()

> **setOptions**(`changes`): `void`

Merge a serialisable options patch and apply it live. Reflects an `enabled`
change by enabling/disabling, then calls [onOptionsChanged](#onoptionschanged) so the
subclass can apply the rest (re-sync cached fields, re-arm a viewport
plugin, recompute). This is the seam the engine's
`canvas.update({ behaviours: { [id]: patch } })` path invokes — so a settings
editor can retune any behaviour without remounting it.

Subclasses with bespoke apply logic (e.g. clearing selection state on a
mode change) override this and should call `super.setOptions(changes)` first
to keep `_options` — and thus [getOptions](#getoptions) — coherent.

#### Parameters

##### changes

`Partial`\<`TOptions`\>

#### Returns

`void`

#### Inherited from

[`Behaviour`](Behaviour.md).[`setOptions`](Behaviour.md#setoptions)
