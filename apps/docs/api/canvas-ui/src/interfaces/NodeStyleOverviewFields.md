# Interface: NodeStyleOverviewFields

The one field the [NodeStyleOverviewEditorPanel](../../../canvas/src/variables/SpecStore.md) renders — a single colour
(`#rrggbb`, the swatch encoding). Deliberately minimal: the "overview" editor
only recolours a node, working for both simple shapes and composite cards.
`colorToForm` / `formToColor` (`mapping.ts`) round-trip it against the engine's
`0xRRGGBB`.

## Properties

### color?

> `optional` **color?**: `string`

Node colour (`#rrggbb`).
