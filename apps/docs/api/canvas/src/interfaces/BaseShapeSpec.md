# Interface: BaseShapeSpec

Defined in: [packages/canvas/src/renderers/types.ts:55](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L55)

Common shape fields. Every shape spec extends this with its own
shape-specific `kind` discriminant + drawing fields.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:66](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L66)

Per-instance opacity multiplier. Default `1`.

***

### kind

> `readonly` **kind**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:57](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L57)

Registered kind from `registerShape(kind, ...)`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/types.ts:68](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L68)

Hides the shape without removing it. Default `true`.

***

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:58](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L58)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:59](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L59)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:64](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L64)

Draw order within the shape layer. Higher = on top. Default `0`.
Used by hit-testing to resolve overlapping candidates.
