# Class: ThemeBehaviour

What `BehaviourRegistry` sees.

## Extends

- [`Behaviour`](../../../canvas/src/classes/Behaviour.md)\<[`ThemeBehaviourOptions`](../interfaces/ThemeBehaviourOptions.md)\>

## Constructors

### Constructor

> **new ThemeBehaviour**(`opts`): `ThemeBehaviour`

#### Parameters

##### opts

[`ThemeBehaviourOptions`](../interfaces/ThemeBehaviourOptions.md)

#### Returns

`ThemeBehaviour`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`constructor`](../../../canvas/src/classes/Behaviour.md#constructor)

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`_enabled`](../../../canvas/src/classes/Behaviour.md#_enabled)

***

### \_options

> `protected` **\_options**: [`ThemeBehaviourOptions`](../interfaces/ThemeBehaviourOptions.md)

The construction options, merged in-place by [setOptions](#setoptions). Named
`_options` (not `options`) so subclasses that expose a bespoke
`get options()` snapshot don't collide with it. Subclasses read their live
config from here (or from fields re-synced in [onOptionsChanged](#onoptionschanged)).

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`_options`](../../../canvas/src/classes/Behaviour.md#_options)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`ctx`](../../../canvas/src/classes/Behaviour.md#ctx)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`id`](../../../canvas/src/classes/Behaviour.md#id)

***

### kind

> `readonly` **kind**: `"theme"` = `'theme'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
`'wheel-zoom'`). Distinct from [id](EdgeLODBehaviour.md#id) (the per-instance key): all
`DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`kind`](../../../canvas/src/classes/Behaviour.md#kind)

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`scope`](../../../canvas/src/classes/Behaviour.md#scope)

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`shortcuts`](../../../canvas/src/classes/Behaviour.md#shortcuts)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`targetLayerId`](../../../canvas/src/classes/Behaviour.md#targetlayerid)

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`enabled`](../../../canvas/src/classes/Behaviour.md#enabled)

***

### hasGestureClaim

#### Get Signature

> **get** `protected` **hasGestureClaim**(): `boolean`

Does this behaviour currently hold the gesture?

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`hasGestureClaim`](../../../canvas/src/classes/Behaviour.md#hasgestureclaim)

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`isEnabled`](../../../canvas/src/classes/Behaviour.md#isenabled)

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`isRegistered`](../../../canvas/src/classes/Behaviour.md#isregistered)

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

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`claimGesture`](../../../canvas/src/classes/Behaviour.md#claimgesture)

***

### destroy()

> **destroy**(): `void`

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`destroy`](../../../canvas/src/classes/Behaviour.md#destroy)

***

### disable()

> **disable**(): `void`

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`disable`](../../../canvas/src/classes/Behaviour.md#disable)

***

### enable()

> **enable**(): `void`

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`enable`](../../../canvas/src/classes/Behaviour.md#enable)

***

### getActiveName()

> **getActiveName**(): `string`

#### Returns

`string`

***

### getMode()

> **getMode**(): [`ThemeMode`](../type-aliases/ThemeMode.md)

#### Returns

[`ThemeMode`](../type-aliases/ThemeMode.md)

***

### getOptions()

> **getOptions**(): `Readonly`\<`TOptions`\>

Snapshot of the current (merged) options — seeds a settings editor.

#### Returns

`Readonly`\<`TOptions`\>

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`getOptions`](../../../canvas/src/classes/Behaviour.md#getoptions)

***

### getResolvedKind()

> **getResolvedKind**(): [`ThemeKind`](../type-aliases/ThemeKind.md)

Concrete kind currently resolved from mode.

#### Returns

[`ThemeKind`](../type-aliases/ThemeKind.md)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onDestroy`](../../../canvas/src/classes/Behaviour.md#ondestroy)

***

### onDisable()

> `protected` **onDisable**(): `void`

Hook fired on disable.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onDisable`](../../../canvas/src/classes/Behaviour.md#ondisable)

***

### onEnable()

> `protected` **onEnable**(): `void`

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onEnable`](../../../canvas/src/classes/Behaviour.md#onenable)

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

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onOptionsChanged`](../../../canvas/src/classes/Behaviour.md#onoptionschanged)

***

### onRegister()

> `protected` **onRegister**(`_ctx`): `void`

Subscribe to events / setup any handler resources.

#### Parameters

##### \_ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`onRegister`](../../../canvas/src/classes/Behaviour.md#onregister)

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

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`reArm`](../../../canvas/src/classes/Behaviour.md#rearm)

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

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`register`](../../../canvas/src/classes/Behaviour.md#register)

***

### releaseGesture()

> `protected` **releaseGesture**(): `void`

End this behaviour's gesture claim. Safe to call any number of times and
when no claim is held — the arbiter identifies claims by token, so a stale
release can never evict a later owner.

#### Returns

`void`

#### Inherited from

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`releaseGesture`](../../../canvas/src/classes/Behaviour.md#releasegesture)

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

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`serializeDefinition`](../../../canvas/src/classes/Behaviour.md#serializedefinition)

***

### setMode()

> **setMode**(`mode`): `void`

Switch mode. Re-publishes immediately when enabled.

#### Parameters

##### mode

[`ThemeMode`](../type-aliases/ThemeMode.md)

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Patch options and re-publish (when enabled).

#### Parameters

##### patch

`ThemePatch`

#### Returns

`void`

#### Overrides

[`Behaviour`](../../../canvas/src/classes/Behaviour.md).[`setOptions`](../../../canvas/src/classes/Behaviour.md#setoptions)

***

### setTheme()

> **setTheme**(`name`): `void`

Switch the active theme by name. Re-publishes immediately when enabled.

#### Parameters

##### name

`string`

#### Returns

`void`
