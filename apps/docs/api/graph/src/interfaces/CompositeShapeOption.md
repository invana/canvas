# Interface: CompositeShapeOption

Defined in: [graph/src/layer/types.ts:302](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L302)

Composite "card" shape — a fixed-size rounded body with a `parts[]` list of
rects / circles / lines / labels laid out by the caller (or compiled from a
[CardStructure](CardStructure.md) by the template system). First-class so node *card*
templates are type-safe rather than going through the `as unknown` cast.
Maps 1:1 to the canvas `composite` shape spec; `parts` reuses the engine's
CompositePart union.

## Properties

### cornerRadius?

> `readonly` `optional` **cornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:306](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L306)

***

### fill?

> `readonly` `optional` **fill?**: `number`

Defined in: [graph/src/layer/types.ts:307](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L307)

***

### fillAlpha?

> `readonly` `optional` **fillAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:308](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L308)

***

### height

> `readonly` **height**: `number`

Defined in: [graph/src/layer/types.ts:305](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L305)

***

### kind

> `readonly` **kind**: `"composite"`

Defined in: [graph/src/layer/types.ts:303](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L303)

***

### parts

> `readonly` **parts**: readonly `CompositePart`[]

Defined in: [graph/src/layer/types.ts:310](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L310)

***

### stroke?

> `readonly` `optional` **stroke?**: `object`

Defined in: [graph/src/layer/types.ts:309](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L309)

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### color

> `readonly` **color**: `number`

#### width?

> `readonly` `optional` **width?**: `number`

***

### width

> `readonly` **width**: `number`

Defined in: [graph/src/layer/types.ts:304](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L304)
