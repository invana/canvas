# Class: SchemaTableCard

**ER / schema table** card — a coloured header (optional icon + title) over
one row per field (colour-coded type chip + name + data type). Auto-sizes to
the field count; each row is an addressable sub-part (`hitId = row index`).
Fully configured by [SchemaTableCardSpec](../interfaces/SchemaTableCardSpec.md); override [typeChip](#typechip) /
[header](#header) / [row](#row) for structural changes.

## Extends

- [`CompositeCard`](CompositeCard.md)\<[`SchemaTableCardSpec`](../interfaces/SchemaTableCardSpec.md), [`SchemaTableData`](../interfaces/SchemaTableData.md), [`SchemaTableCardOptions`](../interfaces/SchemaTableCardOptions.md)\>

## Constructors

### Constructor

> **new SchemaTableCard**(`spec?`): `SchemaTableCard`

#### Parameters

##### spec?

`Partial`\<[`SchemaTableCardSpec`](../interfaces/SchemaTableCardSpec.md)\> = `{}`

#### Returns

`SchemaTableCard`

#### Overrides

[`CompositeCard`](CompositeCard.md).[`constructor`](CompositeCard.md#constructor)

## Properties

### spec

> `readonly` **spec**: [`SchemaTableCardSpec`](../interfaces/SchemaTableCardSpec.md)

The card's full, resolved configuration. Mutable — edit to re-style.

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`spec`](CompositeCard.md#spec)

## Methods

### build()

> **build**(`data`, `opts?`): [`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

Build the composite spec for one node's data (+ optional per-call opts).

#### Parameters

##### data

[`SchemaTableData`](../interfaces/SchemaTableData.md)

##### opts?

[`SchemaTableCardOptions`](../interfaces/SchemaTableCardOptions.md)

#### Returns

[`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`build`](CompositeCard.md#build)

***

### frame()

> `protected` **frame**(`data`): [`CardFrame`](../interfaces/CardFrame.md)

The card box + fill / stroke / clip, given the assembled parts.

#### Parameters

##### data

[`SchemaTableData`](../interfaces/SchemaTableData.md)

#### Returns

[`CardFrame`](../interfaces/CardFrame.md)

#### Overrides

[`CompositeCard`](CompositeCard.md).[`frame`](CompositeCard.md#frame)

***

### header()

> `protected` **header**(`data`, `parts`): `void`

Header band (icon + title).

#### Parameters

##### data

[`SchemaTableData`](../interfaces/SchemaTableData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### parts()

> `protected` **parts**(`data`, `opts`): `CompositePart`[]

Assemble the ordered [CompositePart](../../../canvas/src/variables/SpecStore.md)s for this card.

#### Parameters

##### data

[`SchemaTableData`](../interfaces/SchemaTableData.md)

##### opts

[`SchemaTableCardOptions`](../interfaces/SchemaTableCardOptions.md)

#### Returns

`CompositePart`[]

#### Overrides

[`CompositeCard`](CompositeCard.md).[`parts`](CompositeCard.md#parts)

***

### row()

> `protected` **row**(`field`, `index`, `active`, `parts`): `void`

One field row (chip + name + type).

#### Parameters

##### field

###### name

`string`

###### type

`string`

##### index

`number`

##### active

`boolean`

##### parts

`CompositePart`[]

#### Returns

`void`

***

### typeChip()

> `protected` **typeChip**(`type`): `object`

Colour-coded chip glyph + colour for a field's data type. Override to remap.

#### Parameters

##### type

`string`

#### Returns

`object`

##### char

> **char**: `string`

##### color

> **color**: `number`
