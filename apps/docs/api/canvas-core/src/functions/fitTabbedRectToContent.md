# Function: fitTabbedRectToContent()

> **fitTabbedRectToContent**(`spec`, `content`): `Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

Size the tab to the content it carries — the title.

The taper eats into the tab's top edge, so the slant's run is added on top of
the text budget; otherwise leaning the tab would push the title into the
taper. A centred tab leans on both sides.

The clamp to `width` applies **only while there's a body**: a tab can't
outgrow the rectangle it sits on, but a closed folder is nothing *but* its
tab, so it sizes to the whole title rather than ellipsising it. Returns
nothing when [TabbedRectSpec.tabWidth](../interfaces/TabbedRectSpec.md#tabwidth) is pinned.

## Parameters

### spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

### content

#### height

`number`

#### width

`number`

## Returns

`Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>
