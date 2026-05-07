# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [packages/canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
