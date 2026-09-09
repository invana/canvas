# Class: CanvasThemeState

The default [ThemeState](../interfaces/ThemeState.md) — holds the current [ResolvedTheme](../interfaces/ResolvedTheme.md) and
broadcasts `theme:change` on the bus whenever it is [set](#set). Renderer-free;
a single publisher (the domain `ThemeBehaviour`) resolves authored config →
`ResolvedTheme` and calls [set](#set). Theme-aware layers subscribe to
`theme:change` (or read [current](#current)) and recolour.

## Implements

- [`ThemeState`](../interfaces/ThemeState.md)

## Constructors

### Constructor

> **new CanvasThemeState**(`bus`): `CanvasThemeState`

#### Parameters

##### bus

[`CanvasEventBus`](CanvasEventBus.md)

#### Returns

`CanvasThemeState`

## Methods

### current()

> **current**(): [`ResolvedTheme`](../interfaces/ResolvedTheme.md)

The current resolved theme, or `null` before the first [set](../interfaces/ThemeState.md#set).

#### Returns

[`ResolvedTheme`](../interfaces/ResolvedTheme.md)

#### Implementation of

[`ThemeState`](../interfaces/ThemeState.md).[`current`](../interfaces/ThemeState.md#current)

***

### set()

> **set**(`theme`): `void`

Store + broadcast a resolved theme (emits `theme:change`).

#### Parameters

##### theme

[`ResolvedTheme`](../interfaces/ResolvedTheme.md)

#### Returns

`void`

#### Implementation of

[`ThemeState`](../interfaces/ThemeState.md).[`set`](../interfaces/ThemeState.md#set)
