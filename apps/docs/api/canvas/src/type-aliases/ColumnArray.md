# Type Alias: ColumnArray\<T\>

> **ColumnArray**\<`T`\> = `T` *extends* `"i8"` ? `Int8Array` : `T` *extends* `"u8"` ? `Uint8Array` : `T` *extends* `"i16"` ? `Int16Array` : `T` *extends* `"u16"` ? `Uint16Array` : `T` *extends* `"i32"` ? `Int32Array` : `T` *extends* `"u32"` ? `Uint32Array` : `T` *extends* `"f32"` ? `Float32Array` : `T` *extends* `"f64"` ? `Float64Array` : `never`

Defined in: [packages/canvas/src/state/ColumnStore.ts:83](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/ColumnStore.ts#L83)

## Type Parameters

### T

`T` *extends* [`ColumnType`](ColumnType.md)
