# Class: NodeScaleLODBehaviour

## Extends

- `ElementScaleLODBehaviour`\<[`NodeScaleLODBehaviourOptions`](../interfaces/NodeScaleLODBehaviourOptions.md)\>

## Constructors

### Constructor

> **new NodeScaleLODBehaviour**(`opts`): `NodeScaleLODBehaviour`

#### Parameters

##### opts

[`NodeScaleLODBehaviourOptions`](../interfaces/NodeScaleLODBehaviourOptions.md)

#### Returns

`NodeScaleLODBehaviour`

#### Overrides

`ElementScaleLODBehaviour<NodeScaleLODBehaviourOptions>.constructor`

## Properties

### \_enabled

> `protected` **\_enabled**: `boolean`

#### Inherited from

`ElementScaleLODBehaviour._enabled`

***

### \_options

> `protected` **\_options**: [`NodeScaleLODBehaviourOptions`](../interfaces/NodeScaleLODBehaviourOptions.md)

The construction options, merged in-place by [setOptions](#setoptions). Named
`_options` (not `options`) so subclasses that expose a bespoke
`get options()` snapshot don't collide with it. Subclasses read their live
config from here (or from fields re-synced in [onOptionsChanged](#onoptionschanged)).

#### Inherited from

`ElementScaleLODBehaviour._options`

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`ElementScaleLODBehaviour.ctx`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`ElementScaleLODBehaviour.id`

***

### kind

> `readonly` **kind**: `"node-size-lod"` = `'node-size-lod'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
`'wheel-zoom'`). Distinct from [id](EdgeLODBehaviour.md#id) (the per-instance key): all
`DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

`ElementScaleLODBehaviour.kind`

***

### scope

> `readonly` **scope**: `"canvas"` \| `"layer"`

`'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
from the constructor — subclasses don't need to re-declare.

#### Inherited from

`ElementScaleLODBehaviour.scope`

***

### shortcuts?

> `readonly` `optional` **shortcuts?**: readonly `string`[]

#### Inherited from

`ElementScaleLODBehaviour.shortcuts`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

#### Inherited from

`ElementScaleLODBehaviour.targetLayerId`

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

#### Inherited from

`ElementScaleLODBehaviour.enabled`

***

### hasGestureClaim

#### Get Signature

> **get** `protected` **hasGestureClaim**(): `boolean`

Does this behaviour currently hold the gesture?

##### Returns

`boolean`

#### Inherited from

`ElementScaleLODBehaviour.hasGestureClaim`

***

### isEnabled

#### Get Signature

> **get** `protected` **isEnabled**(): `boolean`

Convenience `if (!enabled) return;` for use inside event handlers
(without rebinding `this` cost).

##### Returns

`boolean`

#### Inherited from

`ElementScaleLODBehaviour.isEnabled`

***

### isRegistered

#### Get Signature

> **get** **isRegistered**(): `boolean`

`true` once `register(ctx)` has run. Lets the registry skip already-wired behaviours.

##### Returns

`boolean`

#### Inherited from

`ElementScaleLODBehaviour.isRegistered`

## Methods

### apply()

> `protected` **apply**(`rawScale`): `void`

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

`ElementScaleLODBehaviour.apply`

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

[`GestureClaimOptions`](../../../canvas/src/interfaces/GestureClaimOptions.md)

#### Returns

`boolean`

#### Inherited from

`ElementScaleLODBehaviour.claimGesture`

***

### destroy()

> **destroy**(): `void`

Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions.

#### Returns

`void`

#### Inherited from

`ElementScaleLODBehaviour.destroy`

***

### disable()

> **disable**(): `void`

#### Returns

`void`

#### Inherited from

`ElementScaleLODBehaviour.disable`

***

### enable()

> **enable**(): `void`

#### Returns

`void`

#### Inherited from

`ElementScaleLODBehaviour.enable`

***

### getOptions()

> **getOptions**(): `Readonly`\<`TOptions`\>

Snapshot of the current (merged) options — seeds a settings editor.

#### Returns

`Readonly`\<`TOptions`\>

#### Inherited from

`ElementScaleLODBehaviour.getOptions`

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Inherited from

`ElementScaleLODBehaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

#### Returns

`void`

#### Overrides

`ElementScaleLODBehaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

#### Returns

`void`

#### Overrides

`ElementScaleLODBehaviour.onEnable`

***

### onOptionsChanged()

> `protected` **onOptionsChanged**(): `void`

Re-write the baseline and re-apply the transform when a live option patch
lands (e.g. a `sizePx` / `strokeWidthPx` slider), so the change shows
without waiting for the next zoom. `reflow()` is overridden here to
`writeBaseline('target')` first.

#### Returns

`void`

#### Overrides

`ElementScaleLODBehaviour.onOptionsChanged`

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

`ElementScaleLODBehaviour.onRegister`

***

### onReleaseTargets()

> `protected` **onReleaseTargets**(): `void`

Optional teardown hook — drop layer refs / caches. Default no-op.

#### Returns

`void`

#### Overrides

`ElementScaleLODBehaviour.onReleaseTargets`

***

### onResolveTargets()

> `protected` **onResolveTargets**(`ctx`): `void`

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

`ElementScaleLODBehaviour.onResolveTargets`

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

`ElementScaleLODBehaviour.reArm`

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

#### Overrides

`ElementScaleLODBehaviour.reflow`

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

`ElementScaleLODBehaviour.register`

***

### releaseGesture()

> `protected` **releaseGesture**(): `void`

End this behaviour's gesture claim. Safe to call any number of times and
when no claim is held — the arbiter identifies claims by token, so a stale
release can never evict a later owner.

#### Returns

`void`

#### Inherited from

`ElementScaleLODBehaviour.releaseGesture`

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

`ElementScaleLODBehaviour.serializeDefinition`

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

`ElementScaleLODBehaviour.setOptions`
