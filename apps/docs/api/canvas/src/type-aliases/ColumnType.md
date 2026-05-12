# Type Alias: ColumnType

> **ColumnType** = `"i8"` \| `"u8"` \| `"i16"` \| `"u16"` \| `"i32"` \| `"u32"` \| `"f32"` \| `"f64"`

Defined in: [packages/canvas/src/state/ColumnStore.ts:64](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L64)

Numeric type tags for typed-array columns. Each maps to a JS TypedArray ctor.

- `i8 / u8` — small integers (1 byte). Use for booleans, bitfields, packed enums.
- `i16 / u16` — medium integers (2 bytes). Use for short integer ids, type-tags.
- `i32 / u32` — large integers (4 bytes). Use for slot refs, packed colors, hashes.
- `f32` — single-precision floats (4 bytes). Default for coordinates, weights.
- `f64` — double-precision floats (8 bytes). Use only when precision matters.
