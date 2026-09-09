# Interface: GeometricLayoutOptions

The subset of `GeometricLayoutOptions` this editor produces — a serialisable
patch. `id` / `targetLayerId` (registry wiring) and function options are out
of scope; the tunable scalars round-trip. `transition` / `transitionEase`
come from the shared one-shot layout base.

## Properties

### center?

> `optional` **center?**: `object`

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### clockwise?

> `optional` **clockwise?**: `boolean`

***

### columnGap?

> `optional` **columnGap?**: `number`

***

### columns?

> `optional` **columns?**: `number`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

***

### mode?

> `optional` **mode?**: [`GeometricLayoutMode`](../type-aliases/GeometricLayoutMode.md)

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

***

### radius?

> `optional` **radius?**: `number`

***

### rowGap?

> `optional` **rowGap?**: `number`

***

### startAngle?

> `optional` **startAngle?**: `number`

***

### transition?

> `optional` **transition?**: `boolean`

***

### transitionEase?

> `optional` **transitionEase?**: `string`
