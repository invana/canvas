# Class: CanvasThemeState

Defined in: canvas/src/theme/CanvasThemeState.ts:12

Default [ThemeState](../interfaces/ThemeState.md) implementation owned by [Canvas](Canvas.md). Holds the
last-published [ResolvedTheme](../interfaces/ResolvedTheme.md) and re-broadcasts it on the canvas bus
as `'theme:change'` so theme-aware layers can recolour without polling.

Constructed once in the `Canvas` constructor (the bus already exists there),
then handed to layers/behaviours via `ctx.theme`.

## Implements

- [`ThemeState`](../interfaces/ThemeState.md)

## Constructors

### Constructor

> **new CanvasThemeState**(`bus`): `CanvasThemeState`

Defined in: canvas/src/theme/CanvasThemeState.ts:15

#### Parameters

##### bus

[`CanvasEventBus`](CanvasEventBus.md)

#### Returns

`CanvasThemeState`

## Methods

### current()

> **current**(): [`ResolvedTheme`](../interfaces/ResolvedTheme.md)

Defined in: canvas/src/theme/CanvasThemeState.ts:17

The currently-published resolved theme, or `null` before any is set.

#### Returns

[`ResolvedTheme`](../interfaces/ResolvedTheme.md)

#### Implementation of

[`ThemeState`](../interfaces/ThemeState.md).[`current`](../interfaces/ThemeState.md#current)

***

### set()

> **set**(`theme`): `void`

Defined in: canvas/src/theme/CanvasThemeState.ts:21

Store a resolved theme and broadcast `'theme:change'` on the bus.

#### Parameters

##### theme

[`ResolvedTheme`](../interfaces/ResolvedTheme.md)

#### Returns

`void`

#### Implementation of

[`ThemeState`](../interfaces/ThemeState.md).[`set`](../interfaces/ThemeState.md#set)
