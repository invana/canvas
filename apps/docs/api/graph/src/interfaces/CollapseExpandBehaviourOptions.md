# Interface: CollapseExpandBehaviourOptions

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### centerOnToggle?

> `optional` **centerOnToggle?**: `boolean`

Pan the camera to centre the frame after it opens or closes. Default
`true`.

Both directions move a lot of pixels — closing pulls a large frame down to
a tab, opening pushes it back out — and the toggle the user just clicked
ends up somewhere other than where they left it. Re-centring keeps the
frame under the eye instead. Zoom is untouched; this is a pan only.

***

### doubleClickToToggle?

> `optional` **doubleClickToToggle?**: `boolean`

Double-clicking a group frame toggles it, as a second route to the same
flip the `+` / `−` button performs. Default `true`.

The target is the frame itself, anywhere it is the topmost thing under the
pointer — its tab, its padding, the gaps between its members. A
double-click that lands on a **member node** belongs to that node and is
ignored here (the renderer's hit test ranks by z-index, and an expanded
frame deliberately paints *under* its children). Double-clicking a
collapsed frame re-opens it.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
