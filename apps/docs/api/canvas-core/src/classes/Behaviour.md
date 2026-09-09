# Abstract Class: Behaviour\<TOptions\>

What `BehaviourRegistry` sees.

## Type Parameters

### TOptions

`TOptions` *extends* [`BehaviourOptions`](../interfaces/BehaviourOptions.md) = [`BehaviourOptions`](../interfaces/BehaviourOptions.md)

## Implements

- [`IBehaviour`](../interfaces/IBehaviour.md)

## Constructors

### Constructor

> **new Behaviour**\<`TOptions`\>(`opts`): `Behaviour`\<`TOptions`\>

#### Parameters

##### opts

`TOptions`

#### Returns

`Behaviour`\<`TOptions`\>

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

***

### \_options

> `protected` **\_options**: `TOptions`

The construction options, merged in-place by [setOptions](#setoptions). Named
`_options` (not `options`) so subclasses that expose a bespoke
`get options()` snapshot don't collide with it. Subclasses read their live
config from here (or from fields re-synced in [onOptionsChanged](#onoptionschanged)).

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

***

### id

> `readonly` **id**: `string`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`id`](../interfaces/IBehaviour.md#id)

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
`'wheel-zoom'`). Distinct from [id](#id) (the per-instance key): all
`DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`scope`](../interfaces/IBehaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`shortcuts`](../interfaces/IBehaviour.md#shortcuts)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`targetLayerId`](../interfaces/IBehaviour.md#targetlayerid)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enabled`](../interfaces/IBehaviour.md#enabled)

***

### hasGestureClaim

#### Get Signature

> **get** `protected` **hasGestureClaim**(): `boolean`

Does this behaviour currently hold the gesture?

##### Returns

`boolean`

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`isRegistered`](../interfaces/IBehaviour.md#isregistered)

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

[`GestureClaimOptions`](../interfaces/GestureClaimOptions.md)

#### Returns

`boolean`

***

### destroy()

> **destroy**(): `void`

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`destroy`](../interfaces/IBehaviour.md#destroy)

***

### disable()

> **disable**(): `void`

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`disable`](../interfaces/IBehaviour.md#disable)

***

### enable()

> **enable**(): `void`

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`enable`](../interfaces/IBehaviour.md#enable)

***

### getOptions()

> **getOptions**(): `Readonly`\<`TOptions`\>

Snapshot of the current (merged) options — seeds a settings editor.

#### Returns

`Readonly`\<`TOptions`\>

***

### onDestroy()

> `protected` **onDestroy**(`_ctx`): `void`

Cleanup on destroy. Default no-op.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onDisable()

> `protected` **onDisable**(): `void`

Hook fired on disable.

#### Returns

`void`

***

### onEnable()

> `protected` **onEnable**(): `void`

Hook fired when the developer enables the behaviour.

#### Returns

`void`

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

***

### onRegister()

> `abstract` `protected` **onRegister**(`ctx`): `void`

Subscribe to events / setup any handler resources.

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

***

### register()

> **register**(`ctx`): `void`

Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs.

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`register`](../interfaces/IBehaviour.md#register)

***

### releaseGesture()

> `protected` **releaseGesture**(): `void`

End this behaviour's gesture claim. Safe to call any number of times and
when no claim is held — the arbiter identifies claims by token, so a stale
release can never evict a later owner.

#### Returns

`void`

***

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Contribute this behaviour's serialisable config to a canvas-state snapshot
(the engine's `DefinitionSerializable` contract). The base implementation
captures the explicit `enabled` flag (rule 7). Subclasses with additional
JSON-serialisable options should override and spread `super.serializeDefinition()`.

#### Returns

`Record`\<`string`, `unknown`\>

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

#### Implementation of

[`IBehaviour`](../interfaces/IBehaviour.md).[`setOptions`](../interfaces/IBehaviour.md#setoptions)
