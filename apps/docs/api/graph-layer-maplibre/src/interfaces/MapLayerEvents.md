# Interface: MapLayerEvents

Event payloads emitted by [MapLayer](../classes/MapLayer.md).

## Extends

- [`EventMap`](../../../canvas/src/type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### map:move

> **map:move**: `object`

Fired each time the map transform changes (move / zoom / resize).

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`

***

### map:ready

> **map:ready**: `object`

Fired once after MapLibre's `load` event — style + initial tiles ready.

#### center

> **center**: \[`number`, `number`\]

#### zoom

> **zoom**: `number`
