# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
