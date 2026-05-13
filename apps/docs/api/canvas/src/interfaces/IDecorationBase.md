# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: [packages/canvas/src/primitives/types.ts:729](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L729)

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

Defined in: [packages/canvas/src/primitives/types.ts:730](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L730)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/types.ts:734](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L734)

#### Returns

`void`

***

### getEndPadding()?

> `optional` **getEndPadding**(): `object`

Defined in: [packages/canvas/src/primitives/types.ts:745](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L745)

Connector-only: declare how many pixels of extra "outer extent" this
decoration needs past each endpoint of the routed path. The renderer
aggregates the max across all attached decorations and trims the path
by that amount before drawing — so the body + markers sit back from
the anchor, and the decoration's outer edge (halo radius, ripple peak)
lands at the anchor instead of overshooting into the host shape.
Omit (or return 0) when the decoration doesn't extend past endpoints
(e.g. marching-ants strokes the line at the host's width).

#### Returns

`object`

##### source

> `readonly` **source**: `number`

##### target

> `readonly` **target**: `number`

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:731](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L731)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:733](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L733)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:732](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L732)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
