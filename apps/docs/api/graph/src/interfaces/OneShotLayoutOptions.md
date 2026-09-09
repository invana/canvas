# Interface: OneShotLayoutOptions

Options shared by every one-shot (deterministic) layout.

## Extends

- [`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md)

## Extended by

- [`SubgraphLayoutOptions`](SubgraphLayoutOptions.md)

## Properties

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

[`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md).[`id`](../../../canvas/src/interfaces/LayoutOptions.md#id)

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes are excluded from placement so they don't perturb the visible graph,
and their last positions are left frozen (the layout never writes them).

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

[`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/LayoutOptions.md#targetlayerid)

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses [DEFAULT\_POSITION\_TRANSITION\_MS](../../../canvas/src/variables/DEFAULT_POSITION_TRANSITION_MS.md); a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

***

### transitionEase?

> `optional` **transitionEase?**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing curve for the transition, as a serializable [EasingName](../../../canvas/src/type-aliases/EasingName.md) key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.
