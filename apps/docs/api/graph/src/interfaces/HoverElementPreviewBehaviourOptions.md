# Interface: HoverElementPreviewBehaviourOptions

Constructor options for `HoverElementPreviewBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### card?

> `optional` **card?**: [`HoverElementPreviewCardSpec`](HoverElementPreviewCardSpec.md)

The serializable card template — the **fallback** used when no per-type
spec in [cards](#cards) matches the hovered element. Default `{}`.

***

### cards?

> `optional` **cards?**: [`HoverElementPreviewCardsByType`](HoverElementPreviewCardsByType.md)

Per-type card specs, keyed by element `type` (`cards.nodes[type]` /
`cards.edges[type]`). Lets a 'person' node and a 'company' node show
different fields. Serializable — define it in a UI / display settings.
Falls back to [card](#card) when a type has no entry. Default `{}`.

***

### closeDelay?

> `optional` **closeDelay?**: `number`

Grace period, in ms, after the pointer leaves before the card hides —
smooths jitter when crossing element gaps. Default `50`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`, `kind`) => `boolean`)

Per-target enable predicate. `boolean` is a global on/off; a function runs
per hover with the live `GraphNode` / `GraphEdge` record (+ its `kind`) and
may veto showing a card for that element. Default `true`.

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

### interactive?

> `optional` **interactive?**: `boolean`

Interactive card — let the pointer enter the card (to select text, click
links, scroll) without it vanishing. Default `true`. Set `false` for a
passive, click-through tooltip.

When `true`, leaving the canvas does **not** hide immediately; instead the
`closeDelay` grace timer runs, giving the pointer time to reach the card.
The consumer must render the card with pointer events enabled and call
[HoverElementPreviewBehaviour.holdOpen](../classes/HoverElementPreviewBehaviour.md#holdopen) on the card's `pointerenter` (to
cancel the pending hide) and [HoverElementPreviewBehaviour.releaseHold](../classes/HoverElementPreviewBehaviour.md#releasehold) on
its `pointerleave`. Needs a non-zero `closeDelay` to bridge the gap between
the element and the card — pair it with e.g. `closeDelay: 200`.

***

### onHide?

> `optional` **onHide?**: () => `void`

Fired when the card hides.

#### Returns

`void`

***

### onShow?

> `optional` **onShow?**: (`snapshot`) => `void`

Fired when a card becomes visible.

#### Parameters

##### snapshot

[`PreviewSnapshot`](../type-aliases/PreviewSnapshot.md)

#### Returns

`void`

***

### openDelay?

> `optional` **openDelay?**: `number`

Dwell, in ms, before a hovered element's card shows. Default `50`.

***

### placement?

> `optional` **placement?**: [`PreviewPlacement`](../type-aliases/PreviewPlacement.md)

Anchor placement hint passed through to the consumer. Default `'bottom-right'`.

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

Required — the `GraphLayer` id this behaviour watches.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### targets?

> `optional` **targets?**: readonly [`GraphElementKind`](../type-aliases/GraphElementKind.md)[]

Which kinds fire a preview. A hover on a kind not listed is ignored.
Default `['node', 'edge']`.
