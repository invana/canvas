# Type Alias: LayoutEvents

> **LayoutEvents** = `object`

Defined in: [canvas/src/layouts/Layout.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L58)

Lifecycle events fired by every `Layout`.

Subclass-specific telemetry (e.g. d3-force's `alpha`) belongs on a
subclass-specific event map, not here.

## Properties

### end

> **end**: `object`

Defined in: [canvas/src/layouts/Layout.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L72)

#### reason

> **reason**: [`LayoutEndReason`](LayoutEndReason.md)

***

### start

> **start**: `object`

Defined in: [canvas/src/layouts/Layout.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L70)

Run is about to produce positions. Optional run-size / animation metadata
lets a `Canvas.runLayout` bridge forward it onto the canvas bus as
`layout:run:start` without reaching into layer internals. Every field is
optional — a layout that doesn't know (or care) emits `{}`, and the bridge
substitutes `0` / `false`.

 - `nodeCount` / `edgeCount` — size of the run, for progress UIs / telemetry.
 - `animate` — whether the run animates its settle (iterative force sims)
   vs. jumps straight to final positions; render policies branch on it.

#### animate?

> `optional` **animate?**: `boolean`

#### edgeCount?

> `optional` **edgeCount?**: `number`

#### nodeCount?

> `optional` **nodeCount?**: `number`

***

### tick

> **tick**: `Record`\<`string`, `never`\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L71)
