# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: packages/canvas/src/primitives/types.ts:375

Common base for shape and connector decorations. Presence of `tick` makes
the decoration animated — the renderer registers it into the per-frame
animation set; `tick` returns `true` to keep ticking, `false` to retire.
Static decorations omit `tick` and cost zero per frame after `mount`.

## Type Parameters

### THostInfo

`THostInfo`

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

Defined in: packages/canvas/src/primitives/types.ts:376

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: packages/canvas/src/primitives/types.ts:380

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: packages/canvas/src/primitives/types.ts:377

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: packages/canvas/src/primitives/types.ts:379

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: packages/canvas/src/primitives/types.ts:378

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
