# Interface: ThemeBehaviourOptions

Construction options for [ThemeBehaviour](../classes/ThemeBehaviour.md).

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### accent?

> `optional` **accent?**: `number` \| `"css-var"`

Source for the `accent` role. `'css-var'` reads [accentVar](#accentvar) live off
the document root; a `number` pins it. Omit to use the theme's own accent.

***

### accentVar?

> `optional` **accentVar?**: `string`

CSS custom property read when `accent: 'css-var'`. Default `'--color-primary'`.

***

### active?

> `optional` **active?**: `string`

Active theme name. Default `fallback`. Matched to the host theme family.

***

### dark?

> `optional` **dark?**: `Record`\<`string`, `unknown`\>

Single-layer shorthand: patch pushed to [targetLayerId](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid) in dark mode.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### fallback?

> `optional` **fallback?**: `string`

Theme used when `active` isn't found. Default `'default'`.

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### light?

> `optional` **light?**: `Record`\<`string`, `unknown`\>

Single-layer shorthand: patch pushed to [targetLayerId](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid) in light mode.

***

### mode?

> `optional` **mode?**: [`ThemeMode`](../type-aliases/ThemeMode.md)

`'system'` (default) follows `prefers-color-scheme`; `'light'`/`'dark'` pin.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### themes?

> `optional` **themes?**: [`ThemeRegistry`](../type-aliases/ThemeRegistry.md)

Consumer themes, merged over the built-ins (`default/forest/ocean/gold/rose/minimal`).
