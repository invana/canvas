# Class: UserCard

**Profile / user** card — avatar disc (initials) + status dot, name + role, a
divider, and up to two Lucide contact rows. A top accent bar (avatar colour)
follows the rounded corners via `clip`. Configured by [UserCardSpec](../interfaces/UserCardSpec.md);
override [topAccent](#topaccent) / [avatar](#avatar) / [identity](#identity) /
[contacts](#contacts) for structural changes.

## Extends

- [`CompositeCard`](CompositeCard.md)\<[`UserCardSpec`](../interfaces/UserCardSpec.md), [`UserCardData`](../interfaces/UserCardData.md)\>

## Constructors

### Constructor

> **new UserCard**(`spec?`): `UserCard`

#### Parameters

##### spec?

`Partial`\<[`UserCardSpec`](../interfaces/UserCardSpec.md)\> = `{}`

#### Returns

`UserCard`

#### Overrides

[`CompositeCard`](CompositeCard.md).[`constructor`](CompositeCard.md#constructor)

## Properties

### spec

> `readonly` **spec**: [`UserCardSpec`](../interfaces/UserCardSpec.md)

The card's full, resolved configuration. Mutable — edit to re-style.

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`spec`](CompositeCard.md#spec)

## Methods

### avatar()

> `protected` **avatar**(`data`, `parts`): `void`

Avatar disc + initials + status dot.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

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

[`UserCardData`](../interfaces/UserCardData.md)

##### opts?

`void`

#### Returns

[`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

#### Inherited from

[`CompositeCard`](CompositeCard.md).[`build`](CompositeCard.md#build)

***

### contactRows()

> `protected` **contactRows**(`data`): `object`[]

The contact rows this card renders (mail / phone), in order.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

#### Returns

`object`[]

***

### contacts()

> `protected` **contacts**(`data`, `parts`): `void`

Contact rows (icon + text) below the divider.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`

***

### dividerY()

> `protected` **dividerY**(): `number`

Y of the divider (below the avatar block).

#### Returns

`number`

***

### frame()

> `protected` **frame**(`data`): [`CardFrame`](../interfaces/CardFrame.md)

The card box + fill / stroke / clip, given the assembled parts.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

#### Returns

[`CardFrame`](../interfaces/CardFrame.md)

#### Overrides

[`CompositeCard`](CompositeCard.md).[`frame`](CompositeCard.md#frame)

***

### identity()

> `protected` **identity**(`data`, `parts`): `void`

Name + role, beside the avatar.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

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

[`UserCardData`](../interfaces/UserCardData.md)

#### Returns

`CompositePart`[]

#### Overrides

[`CompositeCard`](CompositeCard.md).[`parts`](CompositeCard.md#parts)

***

### topAccent()

> `protected` **topAccent**(`data`, `parts`): `void`

Top accent bar (avatar colour). Set `spec.accentHeight = 0` or override to hide.

#### Parameters

##### data

[`UserCardData`](../interfaces/UserCardData.md)

##### parts

`CompositePart`[]

#### Returns

`void`
