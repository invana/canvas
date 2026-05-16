# Type Alias: LayoutEvents

> **LayoutEvents** = `object`

Defined in: [canvas/src/layouts/Layout.ts:58](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layouts/Layout.ts#L58)

Lifecycle events fired by every `Layout`.

Subclass-specific telemetry (e.g. d3-force's `alpha`) belongs on a
subclass-specific event map, not here.

## Properties

### end

> **end**: `object`

Defined in: [canvas/src/layouts/Layout.ts:61](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layouts/Layout.ts#L61)

#### reason

> **reason**: [`LayoutEndReason`](LayoutEndReason.md)

***

### start

> **start**: `Record`\<`string`, `never`\>

Defined in: [canvas/src/layouts/Layout.ts:59](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layouts/Layout.ts#L59)

***

### tick

> **tick**: `Record`\<`string`, `never`\>

Defined in: [canvas/src/layouts/Layout.ts:60](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layouts/Layout.ts#L60)
