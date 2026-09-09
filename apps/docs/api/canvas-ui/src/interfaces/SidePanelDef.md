# Interface: SidePanelDef

A dockable side panel, described declaratively. The hook turns each of these
into a header **toggle item** and (while open) the **`right` region** body — so
you never hand-wire the toggle, the open-state, or the region render-fn per app.

## Properties

### activeIcon?

> `optional` **activeIcon?**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Icon while the panel is open — an open/close flip (e.g. `PanelRightOpen` ⇄ `PanelRightClose`).

***

### activeLabel?

> `optional` **activeLabel?**: `string`

Label while the panel is open. Default `"<label>: shown"`.

***

### collapsible?

> `optional` **collapsible?**: `boolean`

Per-panel: allow the drag handle to fully collapse the region.

***

### defaultSize?

> `optional` **defaultSize?**: `string` \| `number`

Per-panel initial region size (overrides [UseSidePanelsOptions.section](UseSidePanelsOptions.md#section)).

***

### icon

> **icon**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Toggle icon shown in the shared toolbar (inactive, and active unless [activeIcon](#activeicon)).

***

### id

> **id**: `string`

Stable id — the toggle key + the "which panel is open" discriminator.

***

### label

> **label**: `string`

Toggle label. The item flips `"<label>: hidden"` ⇄ `"<label>: shown"` with the
open-state (a `ToolbarItems` toggle convention); pass `activeLabel` to override.

***

### maxSize?

> `optional` **maxSize?**: `string` \| `number`

Per-panel maximum region size.

***

### minSize?

> `optional` **minSize?**: `string` \| `number`

Per-panel minimum region size.

***

### render

> **render**: (`canvas`) => `ReactNode`

Panel body — handed the live engine (`null` until every layer registers).

#### Parameters

##### canvas

`GraphCanvas`

#### Returns

`ReactNode`
