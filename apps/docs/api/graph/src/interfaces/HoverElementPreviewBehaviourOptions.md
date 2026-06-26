# Interface: HoverElementPreviewBehaviourOptions

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:230](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L230)

Constructor options for `HoverElementPreviewBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### card?

> `optional` **card?**: [`HoverElementPreviewCardSpec`](HoverElementPreviewCardSpec.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:278](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L278)

The serializable card template — the **fallback** used when no per-type
spec in [cards](#cards) matches the hovered element. Default `{}`.

***

### cards?

> `optional` **cards?**: [`HoverElementPreviewCardsByType`](HoverElementPreviewCardsByType.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:286](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L286)

Per-type card specs, keyed by element `type` (`cards.nodes[type]` /
`cards.edges[type]`). Lets a 'person' node and a 'company' node show
different fields. Serializable — define it in a UI / display settings.
Falls back to [card](#card) when a type has no entry. Default `{}`.

***

### closeDelay?

> `optional` **closeDelay?**: `number`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:247](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L247)

Grace period, in ms, after the pointer leaves before the card hides —
smooths jitter when crossing element gaps. Default `50`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`, `kind`) => `boolean`)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:272](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L272)

Per-target enable predicate. `boolean` is a global on/off; a function runs
per hover with the live `GraphNode` / `GraphEdge` record (+ its `kind`) and
may veto showing a card for that element. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### interactive?

> `optional` **interactive?**: `boolean`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:265](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L265)

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

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:291](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L291)

Fired when the card hides.

#### Returns

`void`

***

### onShow?

> `optional` **onShow?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:289](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L289)

Fired when a card becomes visible.

#### Parameters

##### snapshot

[`PreviewSnapshot`](../type-aliases/PreviewSnapshot.md)

#### Returns

`void`

***

### openDelay?

> `optional` **openDelay?**: `number`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:241](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L241)

Dwell, in ms, before a hovered element's card shows. Default `50`.

***

### placement?

> `optional` **placement?**: [`PreviewPlacement`](../type-aliases/PreviewPlacement.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:250](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L250)

Anchor placement hint passed through to the consumer. Default `'bottom-right'`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:232](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L232)

Required — the `GraphLayer` id this behaviour watches.

#### Overrides

`BehaviourOptions.targetLayerId`

***

### targets?

> `optional` **targets?**: readonly [`GraphElementKind`](../type-aliases/GraphElementKind.md)[]

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:238](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L238)

Which kinds fire a preview. A hover on a kind not listed is ignored.
Default `['node', 'edge']`.
