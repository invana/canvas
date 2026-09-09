# Interface: BackgroundLayerOptions

The subset of `BackgroundLayerOptions` this editor produces. Colours are
emitted as scalar strings (hex / CSS) — the engine's `BackgroundColor` also
accepts a `{ light, dark }` pair, which is out of scope for the scalar form
(such values round-trip untouched; see `mapping.ts`).

## Properties

### alpha?

> `optional` **alpha?**: `number`

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Solid backdrop colour painted behind the pattern.

***

### color?

> `optional` **color?**: `string`

Pattern foreground colour.

***

### followCamera?

> `optional` **followCamera?**: `boolean`

***

### hidePatternBelowZoom?

> `optional` **hidePatternBelowZoom?**: `number`

Camera scale below which the pattern is hidden. `0` disables the cutoff.

***

### mode?

> `optional` **mode?**: [`BackgroundMode`](../type-aliases/BackgroundMode.md)

***

### patternRole?

> `optional` **patternRole?**: `string`

***

### patternType?

> `optional` **patternType?**: [`BackgroundPatternType`](../type-aliases/BackgroundPatternType.md)

***

### size?

> `optional` **size?**: `number`

***

### spacing?

> `optional` **spacing?**: `number`

***

### surfaceRole?

> `optional` **surfaceRole?**: `string`

***

### type?

> `optional` **type?**: [`BackgroundType`](../type-aliases/BackgroundType.md)
