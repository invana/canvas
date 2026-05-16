# Class: D3HierarchyLayout

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:64](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L64)

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)\>

## Constructors

### Constructor

> **new D3HierarchyLayout**(`opts?`): `D3HierarchyLayout`

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:69](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L69)

#### Parameters

##### opts?

[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md) = `{}`

#### Returns

`D3HierarchyLayout`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`constructor`](../../../canvas/src/classes/Layout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layouts/Layout.ts#L71)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`events`](../../../canvas/src/classes/Layout.md#events)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:79](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L79)

Run the layout against `layer`. Resolves after the single position pass
has been written to the store. Lifecycle events fire in order:
`start` → `tick` (once) → `end`.

#### Parameters

##### layer

[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`apply`](../../../canvas/src/classes/Layout.md#apply)

***

### stop()

> **stop**(): `void`

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:343](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L343)

Cancel a run. The synchronous body of `apply()` rarely yields control
 long enough for this to fire, but it keeps the API contract symmetric
 with iterative layouts.

#### Returns

`void`
