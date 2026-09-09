# Class: StatCard

**Stat / KPI** tile — a left accent bar, a caption, an accent-tinted icon
chip, a large value, and a coloured trend-delta row. Configured by
[StatCardSpec](../interfaces/StatCardSpec.md); override [accentBar](#accentbar) / [caption](#caption) /
[iconChip](#iconchip) / [value](#value) / [delta](#delta) for structural changes.

## Extends

- [`CompositeCard`](CompositeCard.md)\<[`StatCardSpec`](../interfaces/StatCardSpec.md), [`StatCardData`](../interfaces/StatCardData.md)\>

## Constructors

### Constructor

> **new StatCard**(`spec?`): `StatCard`

#### Parameters

##### spec?

`Partial`\<[`StatCardSpec`](../interfaces/StatCardSpec.md)\> = `{}`

#### Returns

`StatCard`

#### Overrides

[`CompositeCard`](CompositeCard.md).[`constructor`](CompositeCard.md#constructor)

## Properties

### spec

> `readonly` **spec**: [`StatCardSpec`](../interfaces/StatCardSpec.md)

The card's full, resolved configuration. Mutable — edit to re-style.

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`spec`](CompositeCard.md#spec)

## Methods

### accentBar()

> `protected` **accentBar**(`data`, `parts`): `void`

Left accent bar (clipped to the card corners).

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### build()

> **build**(`data`, `opts?`): [`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

Build the composite spec for one node's data (+ optional per-call opts).

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### opts?

`void`

#### Returns

[`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`build`](CompositeCard.md#build)

***

### caption()

> `protected` **caption**(`data`, `parts`): `void`

Upper-left caption.

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### delta()

> `protected` **delta**(`data`, `parts`): `void`

Trend-delta row (glyph + text).

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### frame()

> `protected` **frame**(): [`CardFrame`](../interfaces/CardFrame.md)

The card box + fill / stroke / clip, given the assembled parts.

#### Returns

[`CardFrame`](../interfaces/CardFrame.md)

#### Overrides

[`CompositeCard`](CompositeCard.md).[`frame`](CompositeCard.md#frame)

***

### iconChip()

> `protected` **iconChip**(`data`, `parts`): `void`

Accent-tinted icon chip (top-right).

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### parts()

> `protected` **parts**(`data`): `CompositePart`[]

Assemble the ordered [CompositePart](../../../canvas/src/variables/SpecStore.md)s for this card.

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

#### Returns

`CompositePart`[]

#### Overrides

[`CompositeCard`](CompositeCard.md).[`parts`](CompositeCard.md#parts)

***

### value()

> `protected` **value**(`data`, `parts`): `void`

The big value.

#### Parameters

##### data

[`StatCardData`](../interfaces/StatCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`
