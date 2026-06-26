# Interface: ThemeBehaviourOptions

Defined in: graph/src/behaviours/ThemeBehaviour.ts:59

Construction options for [ThemeBehaviour](../classes/ThemeBehaviour.md).

## Extends

- `BehaviourOptions`

## Properties

### accent?

> `optional` **accent?**: `number` \| `"css-var"`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:72

Source for the `accent` role. `'css-var'` reads [accentVar](#accentvar) live off
the document root; a `number` pins it. Omit to use the theme's own accent.

***

### accentVar?

> `optional` **accentVar?**: `string`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:74

CSS custom property read when `accent: 'css-var'`. Default `'--color-primary'`.

***

### active?

> `optional` **active?**: `string`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:63

Active theme name. Default `fallback`. Matched to the host theme family.

***

### dark?

> `optional` **dark?**: `Record`\<`string`, `unknown`\>

Defined in: graph/src/behaviours/ThemeBehaviour.ts:78

Single-layer shorthand: patch pushed to [targetLayerId](NodeSizeLODBehaviourOptions.md#targetlayerid) in dark mode.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### fallback?

> `optional` **fallback?**: `string`

Defined in: graph/src/behaviours/ThemeBehaviour.ts:65

Theme used when `active` isn't found. Default `'default'`.

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### light?

> `optional` **light?**: `Record`\<`string`, `unknown`\>

Defined in: graph/src/behaviours/ThemeBehaviour.ts:76

Single-layer shorthand: patch pushed to [targetLayerId](NodeSizeLODBehaviourOptions.md#targetlayerid) in light mode.

***

### mode?

> `optional` **mode?**: [`ThemeMode`](../type-aliases/ThemeMode.md)

Defined in: graph/src/behaviours/ThemeBehaviour.ts:67

`'system'` (default) follows `prefers-color-scheme`; `'light'`/`'dark'` pin.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:731

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

`BehaviourOptions.targetLayerId`

***

### themes?

> `optional` **themes?**: [`ThemeRegistry`](../type-aliases/ThemeRegistry.md)

Defined in: graph/src/behaviours/ThemeBehaviour.ts:61

Consumer themes, merged over the built-ins (`default/forest/ocean/gold/rose/minimal`).
