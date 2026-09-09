# Interface: BrushSelectOptions

The subset of `BrushSelectBehaviourOptions` this editor produces — a
serialisable patch. Callback (`onSelect`), the `enable` predicate, the
`clickSelectId` cross-behaviour reference, `strokeDash`, and base fields
(`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
user-tunable scalars/enums/colours round-trip. `enableElements` keeps the
engine's array encoding; `trigger` keeps its `BrushModifierKey[]` encoding.

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

***

### enableElements?

> `optional` **enableElements?**: (`"shape"` \| `"connector"`)[]

***

### immediately?

> `optional` **immediately?**: `boolean`

***

### state?

> `optional` **state?**: `string`

***

### style?

> `optional` **style?**: `BrushSelectStyleOptions`

***

### trigger?

> `optional` **trigger?**: `BrushSelectModifierKey`[]
