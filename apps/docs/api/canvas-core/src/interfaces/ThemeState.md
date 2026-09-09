# Interface: ThemeState

The theme channel — read the current resolved theme, or set (and broadcast) a new one.

## Methods

### current()

> **current**(): [`ResolvedTheme`](ResolvedTheme.md)

The current resolved theme, or `null` before the first [set](#set).

#### Returns

[`ResolvedTheme`](ResolvedTheme.md)

***

### set()

> **set**(`theme`): `void`

Store + broadcast a resolved theme (emits `theme:change`).

#### Parameters

##### theme

[`ResolvedTheme`](ResolvedTheme.md)

#### Returns

`void`
