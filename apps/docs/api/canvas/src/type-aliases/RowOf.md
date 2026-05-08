# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [packages/canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
