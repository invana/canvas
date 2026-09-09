# Class: TaskCard

**Kanban task** card — a wrapped title, a priority pill + coloured tag chips,
a divider, and a footer (assignee avatar + due date). A bottom accent bar
(priority colour) follows the rounded corners via `clip`. Configured by
[TaskCardSpec](../interfaces/TaskCardSpec.md); override [pill](#pill) / [title](#title) / [tags](#tags) /
[footer](#footer) for structural changes.

## Extends

- [`CompositeCard`](CompositeCard.md)\<[`TaskCardSpec`](../interfaces/TaskCardSpec.md), [`TaskCardData`](../interfaces/TaskCardData.md)\>

## Constructors

### Constructor

> **new TaskCard**(`spec?`): `TaskCard`

#### Parameters

##### spec?

`Partial`\<[`TaskCardSpec`](../interfaces/TaskCardSpec.md)\> = `{}`

#### Returns

`TaskCard`

#### Overrides

[`CompositeCard`](CompositeCard.md).[`constructor`](CompositeCard.md#constructor)

## Properties

### spec

> `readonly` **spec**: [`TaskCardSpec`](../interfaces/TaskCardSpec.md)

The card's full, resolved configuration. Mutable — edit to re-style.

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`spec`](CompositeCard.md#spec)

## Methods

### bottomAccent()

> `protected` **bottomAccent**(`data`, `parts`): `void`

Bottom accent bar (priority colour).

#### Parameters

##### data

[`TaskCardData`](../interfaces/TaskCardData.md)

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

[`TaskCardData`](../interfaces/TaskCardData.md)

##### opts?

`void`

#### Returns

[`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`build`](CompositeCard.md#build)

***

### footer()

> `protected` **footer**(`data`, `footY`, `parts`): `void`

Footer: assignee avatar (left) + due date (right).

#### Parameters

##### data

[`TaskCardData`](../interfaces/TaskCardData.md)

##### footY

`number`

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

### parts()

> `protected` **parts**(`data`): `CompositePart`[]

Assemble the ordered [CompositePart](../../../canvas/src/variables/SpecStore.md)s for this card.

#### Parameters

##### data

[`TaskCardData`](../interfaces/TaskCardData.md)

#### Returns

`CompositePart`[]

#### Overrides

[`CompositeCard`](CompositeCard.md).[`parts`](CompositeCard.md#parts)

***

### pill()

> `protected` **pill**(`parts`, `x`, `y`, `text`, `color`): `number`

A rounded pill chip (tinted rect + centred label). Returns its width.

#### Parameters

##### parts

`CompositePart`[]

##### x

`number`

##### y

`number`

##### text

`string`

##### color

`number`

#### Returns

`number`

***

### tags()

> `protected` **tags**(`data`, `parts`): `void`

Tag chips, left → right.

#### Parameters

##### data

[`TaskCardData`](../interfaces/TaskCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### title()

> `protected` **title**(`data`, `parts`): `void`

Title (wraps to 2 lines) + the priority pill top-right.

#### Parameters

##### data

[`TaskCardData`](../interfaces/TaskCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`
