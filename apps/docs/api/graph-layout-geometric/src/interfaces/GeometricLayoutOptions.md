# Interface: GeometricLayoutOptions

`GeometricLayout` options.

Extends OneShotLayoutOptions, so it also accepts `id` / `targetLayerId`
(registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
(glide vs snap — owned by the shared `OneShotPositionLayout` base). All three
modes are pure position moves, so they glide by default.

Every field is optional with a sensible default; nodes are placed in store
iteration order.

## Extends

- `SubgraphLayoutOptions`

## Properties

### center?

> `optional` **center?**: `object`

Translate the whole layout by `(x, y)`. Default `{ x: 0, y: 0 }` (centred on origin).

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### clockwise?

> `optional` **clockwise?**: `boolean`

Whether nodes advance clockwise. Default `true`.

***

### columnGap?

> `optional` **columnGap?**: `number`

Horizontal spacing between columns, in world units. Default `60`.

***

### columns?

> `optional` **columns?**: `number`

Column count for `grid` / `snake`. Default `ceil(sqrt(n))` (a square-ish block).

***

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`SubgraphLayoutOptions.id`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

Lay `parentId` **groups** out as containers — each group's members are
placed among themselves, then the whole group is placed as one box at its
parent's level. Only nodes whose resolved style carries `group` count as
containers; a plain `parentId` tree is unaffected.

Default `false`. Containment is exact, but a group's interior is solved
without sight of its external edges — see the class docs. Prefer
`ElkLayout` when edge routing across group boundaries matters.

#### Inherited from

`SubgraphLayoutOptions.includeGroups`

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes are excluded from placement so they don't perturb the visible graph,
and their last positions are left frozen (the layout never writes them).

#### Inherited from

`SubgraphLayoutOptions.includeHidden`

***

### mode?

> `optional` **mode?**: [`GeometricLayoutMode`](../type-aliases/GeometricLayoutMode.md)

Layout mode. Default `'grid'`.

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

Arc spacing used to auto-derive [radius](#radius) when it's omitted. Default `50`.

***

### radius?

> `optional` **radius?**: `number`

Circle radius in world units. Default: auto — derived from the node count
and [nodeSpacing](#nodespacing) so neighbours sit ~`nodeSpacing` apart along the arc.

***

### rowGap?

> `optional` **rowGap?**: `number`

Vertical spacing between rows, in world units. Default `60`.

***

### startAngle?

> `optional` **startAngle?**: `number`

Angle of the first node, in radians. Default `-π/2` (12 o'clock).

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`SubgraphLayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

`SubgraphLayoutOptions.transition`

***

### transitionEase?

> `optional` **transitionEase?**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing curve for the transition, as a serializable [EasingName](../../../canvas/src/type-aliases/EasingName.md) key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

`SubgraphLayoutOptions.transitionEase`
