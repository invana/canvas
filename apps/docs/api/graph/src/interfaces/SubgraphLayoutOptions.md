# Interface: SubgraphLayoutOptions

Options shared by every layout that can lay groups out recursively.

## Extends

- [`OneShotLayoutOptions`](OneShotLayoutOptions.md)

## Properties

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

[`OneShotLayoutOptions`](OneShotLayoutOptions.md).[`id`](OneShotLayoutOptions.md#id)

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

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes are excluded from placement so they don't perturb the visible graph,
and their last positions are left frozen (the layout never writes them).

#### Inherited from

[`OneShotLayoutOptions`](OneShotLayoutOptions.md).[`includeHidden`](OneShotLayoutOptions.md#includehidden)

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

[`OneShotLayoutOptions`](OneShotLayoutOptions.md).[`targetLayerId`](OneShotLayoutOptions.md#targetlayerid)

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses [DEFAULT\_POSITION\_TRANSITION\_MS](../../../canvas/src/variables/DEFAULT_POSITION_TRANSITION_MS.md); a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

[`OneShotLayoutOptions`](OneShotLayoutOptions.md).[`transition`](OneShotLayoutOptions.md#transition)

***

### transitionEase?

> `optional` **transitionEase?**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing curve for the transition, as a serializable [EasingName](../../../canvas/src/type-aliases/EasingName.md) key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

[`OneShotLayoutOptions`](OneShotLayoutOptions.md).[`transitionEase`](OneShotLayoutOptions.md#transitionease)
