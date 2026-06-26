# Interface: ThemeState

Defined in: canvas/src/theme/types.ts:43

The theme channel on [CanvasContext](CanvasContext.md). A **single publisher** (the
domain `ThemeBehaviour`) calls [set](#set); every theme-aware layer reads
[current](#current) and/or subscribes to the `'theme:change'` event. The engine
itself never resolves light/dark — it only relays what the publisher sets.

## Methods

### current()

> **current**(): [`ResolvedTheme`](ResolvedTheme.md)

Defined in: canvas/src/theme/types.ts:45

The currently-published resolved theme, or `null` before any is set.

#### Returns

[`ResolvedTheme`](ResolvedTheme.md)

***

### set()

> **set**(`theme`): `void`

Defined in: canvas/src/theme/types.ts:47

Store a resolved theme and broadcast `'theme:change'` on the bus.

#### Parameters

##### theme

[`ResolvedTheme`](ResolvedTheme.md)

#### Returns

`void`
