# Interface: GeometricLayoutOptions

Defined in: [graph-layout-geometric/src/types.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L24)

`GeometricLayout` options.

Extends OneShotLayoutOptions, so it also accepts `id` / `targetLayerId`
(registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
(glide vs snap — owned by the shared `OneShotPositionLayout` base). All three
modes are pure position moves, so they glide by default.

Every field is optional with a sensible default; nodes are placed in store
iteration order.

## Extends

- `OneShotLayoutOptions`

## Properties

### center?

> `optional` **center?**: `object`

Defined in: [graph-layout-geometric/src/types.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L51)

Translate the whole layout by `(x, y)`. Default `{ x: 0, y: 0 }` (centred on origin).

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### clockwise?

> `optional` **clockwise?**: `boolean`

Defined in: [graph-layout-geometric/src/types.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L47)

Whether nodes advance clockwise. Default `true`.

***

### columnGap?

> `optional` **columnGap?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L32)

Horizontal spacing between columns, in world units. Default `60`.

***

### columns?

> `optional` **columns?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L30)

Column count for `grid` / `snake`. Default `ceil(sqrt(n))` (a square-ish block).

***

### id?

> `optional` **id?**: `string`

Defined in: canvas/dist/index.d.ts:1862

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`OneShotLayoutOptions.id`

***

### mode?

> `optional` **mode?**: [`GeometricLayoutMode`](../type-aliases/GeometricLayoutMode.md)

Defined in: [graph-layout-geometric/src/types.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L26)

Layout mode. Default `'grid'`.

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L43)

Arc spacing used to auto-derive [radius](#radius) when it's omitted. Default `50`.

***

### radius?

> `optional` **radius?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L41)

Circle radius in world units. Default: auto — derived from the node count
and [nodeSpacing](#nodespacing) so neighbours sit ~`nodeSpacing` apart along the arc.

***

### rowGap?

> `optional` **rowGap?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L34)

Vertical spacing between rows, in world units. Default `60`.

***

### startAngle?

> `optional` **startAngle?**: `number`

Defined in: [graph-layout-geometric/src/types.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/types.ts#L45)

Angle of the first node, in radians. Default `-π/2` (12 o'clock).

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1864

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`OneShotLayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Defined in: graph/dist/index.d.ts:2701

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

`OneShotLayoutOptions.transition`

***

### transitionEase?

> `optional` **transitionEase?**: `EasingName`

Defined in: graph/dist/index.d.ts:2706

Easing curve for the transition, as a serializable EasingName key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

`OneShotLayoutOptions.transitionEase`
