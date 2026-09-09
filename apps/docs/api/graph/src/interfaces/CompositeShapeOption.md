# Interface: CompositeShapeOption

Composite "card" shape — a fixed-size rounded body with a `parts[]` list of
rects / circles / lines / labels laid out by the caller (or compiled from a
[CardStructure](CardStructure.md) by the template system). First-class so node *card*
templates are type-safe rather than going through the `as unknown` cast.
Maps 1:1 to the canvas `composite` shape spec; `parts` reuses the engine's
[CompositePart](../../../canvas/src/variables/SpecStore.md) union.

## Properties

### clip?

> `readonly` `optional` **clip?**: `boolean`

Clip parts to the root silhouette so edge-touching parts follow the rounded corners.

***

### cornerRadius?

> `readonly` `optional` **cornerRadius?**: `number`

***

### fill?

> `readonly` `optional` **fill?**: `number`

***

### fillAlpha?

> `readonly` `optional` **fillAlpha?**: `number`

***

### height

> `readonly` **height**: `number`

***

### kind

> `readonly` **kind**: `"composite"`

***

### parts

> `readonly` **parts**: readonly `CompositePart`[]

***

### root?

> `readonly` `optional` **root?**: `CompositeRootSpec`

Background silhouette of the card — a concrete engine root shape (rect /
circle / polygon / regular-polygon / star / arc), centred in the box. Omit
for a rounded rectangle built from `cornerRadius` + `fill` / `stroke`. Fill,
stroke, hit-testing and every decoration follow it.

***

### stroke?

> `readonly` `optional` **stroke?**: `object`

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### color

> `readonly` **color**: `number`

#### width?

> `readonly` `optional` **width?**: `number`

***

### width

> `readonly` **width**: `number`
