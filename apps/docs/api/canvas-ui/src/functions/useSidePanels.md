# Function: useSidePanels()

> **useSidePanels**(`panels`, `options?`): [`UseSidePanelsResult`](../interfaces/UseSidePanelsResult.md)

Turnkey **activity-bar** for `GraphCanvasApp` side panels: from a list of
[SidePanelDef](../interfaces/SidePanelDef.md)s it manages a single open-panel state and returns the
`items` (one shared toolbar of toggles) plus the active panel's `region` — so a
consumer wires it in two lines and the shell stays panel-agnostic:

```tsx
const dock = useSidePanels([
  { id: 'filters', icon: Filter, label: 'Filters', render: (c) => <CanvasFiltersViewPanel canvas={c} /> },
  { id: 'find',    icon: Search, label: 'Find',    render: (c) => <FindInCanvasViewPanel  canvas={c} /> },
]);
<GraphCanvasApp
  header={{ right: <ToolbarItems items={dock.items} /> }}
  right={dock.region}
/>
```

At most one panel occupies the region at a time (toggling one on swaps the dock;
toggling it off drops the region so the canvas reclaims the space). It owns only
the open-state — the panels' own state lives in the panels.

## Parameters

### panels

[`SidePanelDef`](../interfaces/SidePanelDef.md)[]

### options?

[`UseSidePanelsOptions`](../interfaces/UseSidePanelsOptions.md) = `{}`

## Returns

[`UseSidePanelsResult`](../interfaces/UseSidePanelsResult.md)
