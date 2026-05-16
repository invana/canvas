# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: [canvas/src/primitives/types.ts:734](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L734)

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

Defined in: [canvas/src/primitives/types.ts:735](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L735)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:739](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L739)

#### Returns

`void`

***

### getEndPadding()?

> `optional` **getEndPadding**(): `object`

Defined in: [canvas/src/primitives/types.ts:750](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L750)

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

Defined in: [canvas/src/primitives/types.ts:736](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L736)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/types.ts:738](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L738)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:737](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L737)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
