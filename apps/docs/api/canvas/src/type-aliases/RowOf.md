# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
