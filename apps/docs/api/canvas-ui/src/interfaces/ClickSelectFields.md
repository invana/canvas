# Interface: ClickSelectFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`trigger: SelectModifierKey[]` array is collapsed to a single `trigger`
select (`'none'` = no modifier gate); a UI can't express arbitrary modifier
combos and they're rarely used (see `mapping.ts`).

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

> `optional` **trigger?**: `"none"` \| `ClickSelectModifierKey`

Single modifier gate. `'none'` maps to the engine's empty `trigger` array.

***

### unselectedState?

> `optional` **unselectedState?**: `string`
