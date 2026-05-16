# Type Alias: RowOf\<TSchema\>

> **RowOf**\<`TSchema`\> = `{ [K in keyof TSchema]: ColumnValue<TSchema[K]> }`

Defined in: [canvas/src/state/ColumnStore.ts:102](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/state/ColumnStore.ts#L102)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](ColumnSchema.md)
