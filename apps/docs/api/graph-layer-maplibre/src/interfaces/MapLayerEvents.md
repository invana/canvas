# Interface: MapLayerEvents

Defined in: [graph-layer-maplibre/src/types.ts:75](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-maplibre/src/types.ts#L75)

Event payloads emitted by [MapLayer](../classes/MapLayer.md).

## Extends

- [`EventMap`](../../../canvas/src/type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### map:move

> **map:move**: `object`

Defined in: [graph-layer-maplibre/src/types.ts:79](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-maplibre/src/types.ts#L79)

Fired each time the map transform changes (move / zoom / resize).

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`

***

### map:ready

> **map:ready**: `object`

Defined in: [graph-layer-maplibre/src/types.ts:77](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layer-maplibre/src/types.ts#L77)

Fired once after MapLibre's `load` event — style + initial tiles ready.

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`
