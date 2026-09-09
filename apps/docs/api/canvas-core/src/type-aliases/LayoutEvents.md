# Type Alias: LayoutEvents

> **LayoutEvents** = `object`

Lifecycle events fired by every `Layout`.

Subclass-specific telemetry (e.g. d3-force's `alpha`) belongs on a
subclass-specific event map, not here.

## Properties

### end

> **end**: `object`

#### reason

> **reason**: [`LayoutEndReason`](LayoutEndReason.md)

***

### start

> **start**: `object`

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
