# Type Alias: ColumnArray\<T\>

> **ColumnArray**\<`T`\> = `T` *extends* `"i8"` ? `Int8Array` : `T` *extends* `"u8"` ? `Uint8Array` : `T` *extends* `"i16"` ? `Int16Array` : `T` *extends* `"u16"` ? `Uint16Array` : `T` *extends* `"i32"` ? `Int32Array` : `T` *extends* `"u32"` ? `Uint32Array` : `T` *extends* `"f32"` ? `Float32Array` : `T` *extends* `"f64"` ? `Float64Array` : `never`

Defined in: [canvas/src/state/ColumnStore.ts:83](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/state/ColumnStore.ts#L83)

## Type Parameters

### T

`T` *extends* [`ColumnType`](ColumnType.md)
