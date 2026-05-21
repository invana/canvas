# Class: ElkLayout

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:53](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/ElkLayout.ts#L53)

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)\>

## Constructors

### Constructor

> **new ElkLayout**(`opts?`): `ElkLayout`

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/ElkLayout.ts#L66)

#### Parameters

##### opts?

[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md) = `{}`

#### Returns

`ElkLayout`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`constructor`](../../../canvas/src/classes/Layout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layouts/Layout.ts#L71)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`events`](../../../canvas/src/classes/Layout.md#events)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:78](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/ElkLayout.ts#L78)

Run ELK against `layer`. Resolves when ELK settles OR the run is
cancelled by `stop()` / a subsequent `apply()`. Even on cancellation
the Promise resolves (never rejects) — the cancel path emits
`end: { reason: 'stopped' }` and resolves cleanly.

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

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:155](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/ElkLayout.ts#L155)

Cancel an in-flight run. The current ELK Promise (if any) is left to
settle, but its result is dropped. Positions already in the store are
untouched. No-op when idle.

#### Returns

`void`
