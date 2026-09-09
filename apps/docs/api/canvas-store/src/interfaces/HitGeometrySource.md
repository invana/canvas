# Interface: HitGeometrySource

The renderer's side of the picking contract — the three facts specs can't
carry. Returning `null` means "gone"; the index treats it as a miss rather
than an error, because an element can be removed between an index write and
a query.

## Methods

### connectorRecord()

> **connectorRecord**(`id`): [`ConnectorHitRecord`](ConnectorHitRecord.md)

#### Parameters

##### id

`string`

#### Returns

[`ConnectorHitRecord`](ConnectorHitRecord.md)

***

### shapeIds()

> **shapeIds**(): `Iterable`\<`string`\>

Every currently-indexable shape id — for a full reindex.

#### Returns

`Iterable`\<`string`\>

***

### shapeRecord()

> **shapeRecord**(`id`): [`ShapeHitRecord`](ShapeHitRecord.md)

#### Parameters

##### id

`string`

#### Returns

[`ShapeHitRecord`](ShapeHitRecord.md)
