# Class: ThemeBehaviour

Defined in: graph/src/behaviours/ThemeBehaviour.ts:89

## Extends

- `Behaviour`

## Constructors

### Constructor

> **new ThemeBehaviour**(`opts`): `ThemeBehaviour`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:102

#### Parameters

##### opts

[`ThemeBehaviourOptions`](../interfaces/ThemeBehaviourOptions.md)

#### Returns

`ThemeBehaviour`

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

### getActiveName()

> **getActiveName**(): `string`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:164

#### Returns

`string`

***

### getMode()

> **getMode**(): [`ThemeMode`](../type-aliases/ThemeMode.md)

Defined in: graph/src/behaviours/ThemeBehaviour.ts:160

#### Returns

[`ThemeMode`](../type-aliases/ThemeMode.md)

***

### getResolvedKind()

> **getResolvedKind**(): [`ThemeKind`](../type-aliases/ThemeKind.md)

Defined in: graph/src/behaviours/ThemeBehaviour.ts:169

Concrete kind currently resolved from mode.

#### Returns

[`ThemeKind`](../type-aliases/ThemeKind.md)

***

### onDestroy()

> `protected` **onDestroy**(): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:129

Cleanup on destroy. Default no-op.

#### Returns

`void`

#### Overrides

`Behaviour.onDestroy`

***

### onDisable()

> `protected` **onDisable**(): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:125

Hook fired on disable.

#### Returns

`void`

#### Overrides

`Behaviour.onDisable`

***

### onEnable()

> `protected` **onEnable**(): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:120

Hook fired when the developer enables the behaviour.

#### Returns

`void`

#### Overrides

`Behaviour.onEnable`

***

### onRegister()

> `protected` **onRegister**(`_ctx`): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:116

Subscribe to events / setup any handler resources.

#### Parameters

##### \_ctx

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

### setMode()

> **setMode**(`mode`): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:151

Switch mode. Re-publishes immediately when enabled.

#### Parameters

##### mode

[`ThemeMode`](../type-aliases/ThemeMode.md)

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:136

Patch options and re-publish (when enabled).

#### Parameters

##### patch

`ThemePatch`

#### Returns

`void`

***

### setTheme()

> **setTheme**(`name`): `void`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:156

Switch the active theme by name. Re-publishes immediately when enabled.

#### Parameters

##### name

`string`

#### Returns

`void`
