# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
