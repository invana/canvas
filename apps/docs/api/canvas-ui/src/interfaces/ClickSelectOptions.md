# Interface: ClickSelectOptions

The subset of `ClickSelectBehaviourOptions` this editor produces — a
serialisable patch. Callback options (`onSelect` / `onDeselect` /
`onSelectionChange`), the `enable` predicate, and base fields
(`id` / `targetLayerId` / `enabled` / `shortcuts`) are out of scope; only the
user-tunable scalars/enums round-trip. `trigger` keeps the engine's
`SelectModifierKey[]` encoding.

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

***

### degree?

> `optional` **degree?**: `number`

***

### direction?

> `optional` **direction?**: `ClickSelectDirection`

***

### multiple?

> `optional` **multiple?**: `boolean`

***

### raiseActive?

> `optional` **raiseActive?**: `boolean`

***

### state?

> `optional` **state?**: `string`

***

### trigger?

> `optional` **trigger?**: `ClickSelectModifierKey`[]

***

### unselectedState?

> `optional` **unselectedState?**: `string`
