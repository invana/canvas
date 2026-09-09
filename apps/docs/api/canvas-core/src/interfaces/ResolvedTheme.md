# Interface: ResolvedTheme

A fully-resolved theme — every role already a colour number. Plain JSON; no pixi.

## Properties

### categorical?

> `readonly` `optional` **categorical?**: readonly `number`[]

Optional fill-by-category ramp (consumed by colour-by-label / minimap).

***

### kind

> `readonly` **kind**: [`ThemeKind`](../type-aliases/ThemeKind.md)

***

### name

> `readonly` **name**: `string`

Opaque family name (`'default'` | `'forest'` | …) — meaningful to the app, not the kernel.

***

### palette

> `readonly` **palette**: `Readonly`\<`Record`\<`string`, `number`\>\>

Role name → `0xRRGGBB`. The engine theme has no role *enum*; roles are strings.
