# Abstract Class: Layout\<TLayer\>

Defined in: [canvas/src/layouts/Layout.ts:65](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layouts/Layout.ts#L65)

## Extended by

- [`D3ForceLayout`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md)
- [`D3HierarchyLayout`](../../../graph-layout-d3-hierarchy/src/classes/D3HierarchyLayout.md)
- [`D3SankeyLayout`](../../../graph-layout-d3-sankey/src/classes/D3SankeyLayout.md)

## Type Parameters

### TLayer

`TLayer` *extends* [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\> = [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>

## Constructors

### Constructor

> **new Layout**\<`TLayer`\>(): `Layout`\<`TLayer`\>

#### Returns

`Layout`\<`TLayer`\>

## Properties

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`LayoutEvents`](../type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layouts/Layout.ts#L71)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

## Methods

### apply()

> `abstract` **apply**(`layer`): `Promise`\<`void`\>

Defined in: [canvas/src/layouts/Layout.ts:80](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layouts/Layout.ts#L80)

Run the layout against `layer`. Resolves when the run terminates
(either a natural settle or an external `stop()`).

Calling `apply()` again on the same instance must cancel any in-flight
run first.

#### Parameters

##### layer

`TLayer`

#### Returns

`Promise`\<`void`\>
