# Interface: LassoSelectOptions

The subset of `LassoSelectBehaviourOptions` this editor produces — a
serialisable patch. Callback (`onSelect`), the `enable` predicate, the
`clickSelectId` cross-behaviour reference, `strokeDash`, and base fields
(`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
user-tunable scalars/enums/colours round-trip. `enableElements` keeps the
engine's array encoding; `trigger` keeps its `LassoModifierKey[]` encoding.

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

> `optional` **style?**: `LassoSelectStyleOptions`

***

### trigger?

> `optional` **trigger?**: `LassoSelectModifierKey`[]
