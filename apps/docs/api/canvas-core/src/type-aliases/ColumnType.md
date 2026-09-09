# Type Alias: ColumnType

> **ColumnType** = `"i8"` \| `"u8"` \| `"i16"` \| `"u16"` \| `"i32"` \| `"u32"` \| `"f32"` \| `"f64"`

Numeric type tags for typed-array columns. Each maps to a JS TypedArray ctor.
`i8/u8` — bytes (booleans, bitfields, packed enums); `i16/u16` — short ints;
`i32/u32` — slot refs / packed colours / hashes; `f32` — coordinates / weights
(default); `f64` — only when precision matters.
