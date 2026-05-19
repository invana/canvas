# Interface: MapLayerEvents

Defined in: [graph-layer-maplibre/src/types.ts:75](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-maplibre/src/types.ts#L75)

Event payloads emitted by [MapLayer](../classes/MapLayer.md).

## Extends

- [`EventMap`](../../../canvas/src/type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### map:move

> **map:move**: `object`

Defined in: [graph-layer-maplibre/src/types.ts:79](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-maplibre/src/types.ts#L79)

Fired each time the map transform changes (move / zoom / resize).

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`

***

### map:ready

> **map:ready**: `object`

Defined in: [graph-layer-maplibre/src/types.ts:77](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-maplibre/src/types.ts#L77)

Fired once after MapLibre's `load` event — style + initial tiles ready.

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`
