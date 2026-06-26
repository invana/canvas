# Interface: OneShotLayoutOptions

Defined in: [graph/src/layout/OneShotPositionLayout.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L34)

Options shared by every one-shot (deterministic) layout.

## Extends

- `LayoutOptions`

## Properties

### id?

> `optional` **id?**: `string`

Defined in: canvas/dist/index.d.ts:1862

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`LayoutOptions.id`

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1864

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`LayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L43)

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

***

### transitionEase?

> `optional` **transitionEase?**: `EasingName`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L48)

Easing curve for the transition, as a serializable EasingName key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.
