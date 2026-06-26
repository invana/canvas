# Interface: ResolvedTheme

Defined in: canvas/src/theme/types.ts:22

A theme resolved down to concrete numbers — the only theme shape the engine
understands. Plain-JSON (numbers + strings) so it passes the bus's dev-time
serialisability check.

## Properties

### categorical?

> `readonly` `optional` **categorical?**: readonly `number`[]

Defined in: canvas/src/theme/types.ts:34

Optional fill-by-category ramp (e.g. for colour-by-type behaviours).

***

### kind

> `readonly` **kind**: `"light"` \| `"dark"`

Defined in: canvas/src/theme/types.ts:24

Whether this is the light or dark variant of the active theme.

***

### name

> `readonly` **name**: `string`

Defined in: canvas/src/theme/types.ts:26

Active theme name (`'default'` | `'forest'` | … — opaque to the engine).

***

### palette

> `readonly` **palette**: `Readonly`\<`Record`\<`string`, `number`\>\>

Defined in: canvas/src/theme/types.ts:32

Role → colour map. Keys are **string role names** (the engine stays
graph-agnostic — it never enumerates the role vocabulary). Layers read the
roles they care about (e.g. `'surface'`, `'divider'`) and ignore the rest.
