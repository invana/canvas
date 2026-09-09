# Abstract Class: CompositeCard\<TSpec, TData, TOpts\>

Base class for the built-in composite **card** node types — the composite
counterpart to `ShapeBase<TSpec>` (`RectShape` / `CircleShape` / …). Like a
shape, a card is fully driven by a typed **spec**: every knob (width, colours,
radii, spacing) lives in `this.spec`, so *editing the spec* changes the card —
no subclassing needed for values. Subclass and override the `protected`
section methods only when you need to change *structure*.

```ts
// configure via the spec (like RectShape)
const card = new UserCard({ width: 300, bg: 0x1e293b, nameColor: 0xffffff });
node.style.shape = (n) => card.build(n.data as UserCardData);

// …or subclass to change structure
class MyUser extends UserCard { protected topAccent() {} } // no accent bar
```

`spec` fields are mutable — `card.spec.width = 320` re-styles on the next
render. Instances are otherwise stateless, so one renders every node of a type.

## Extended by

- [`SchemaTableCard`](SchemaTableCard.md)
- [`UserCard`](UserCard.md)
- [`StatCard`](StatCard.md)
- [`TaskCard`](TaskCard.md)

## Type Parameters

### TSpec

`TSpec`

### TData

`TData`

### TOpts

`TOpts` = `void`

## Constructors

### Constructor

> **new CompositeCard**\<`TSpec`, `TData`, `TOpts`\>(`spec`): `CompositeCard`\<`TSpec`, `TData`, `TOpts`\>

#### Parameters

##### spec

`TSpec`

#### Returns

`CompositeCard`\<`TSpec`, `TData`, `TOpts`\>

## Properties

### spec

> `readonly` **spec**: `TSpec`

The card's full, resolved configuration. Mutable — edit to re-style.

## Methods

### build()

> **build**(`data`, `opts?`): [`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

Build the composite spec for one node's data (+ optional per-call opts).

#### Parameters

##### data

`TData`

##### opts?

`TOpts`

#### Returns

[`CompositeShapeOption`](../interfaces/CompositeShapeOption.md)

***

### frame()

> `abstract` `protected` **frame**(`data`, `parts`, `opts`): [`CardFrame`](../interfaces/CardFrame.md)

The card box + fill / stroke / clip, given the assembled parts.

#### Parameters

##### data

`TData`

##### parts

readonly `CompositePart`[]

##### opts

`TOpts`

#### Returns

[`CardFrame`](../interfaces/CardFrame.md)

***

### parts()

> `abstract` `protected` **parts**(`data`, `opts`): `CompositePart`[]

Assemble the ordered [CompositePart](../../../canvas/src/variables/SpecStore.md)s for this card.

#### Parameters

##### data

`TData`

##### opts

`TOpts`

#### Returns

`CompositePart`[]
