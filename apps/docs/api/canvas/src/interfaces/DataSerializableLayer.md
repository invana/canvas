# Interface: DataSerializableLayer

The structural contract a [Canvas](../classes/Canvas.md) layer implements to round-trip its
**bulk data** (nodes / edges / rows …) through the JSON state snapshot.

Duck-typed on purpose — `@invana/canvas` can't depend on the domain packages
that own the data (e.g. `@invana/graph`'s `GraphLayer`), so the exporter only
asks: *does this layer expose `exportData` / `importData`?* A layer that holds
no serialisable data simply doesn't implement it and is skipped.

## Methods

### exportData()

> **exportData**(): `unknown`

Return a JSON-serialisable snapshot of this layer's data.

#### Returns

`unknown`

***

### importData()

> **importData**(`data`): `void`

Replace this layer's data from a snapshot previously produced by [exportData](#exportdata).

#### Parameters

##### data

`unknown`

#### Returns

`void`
