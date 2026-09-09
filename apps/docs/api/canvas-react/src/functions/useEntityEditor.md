# Function: useEntityEditor()

> **useEntityEditor**(`options?`, `canvas?`): [`EntityEditorTarget`](../interfaces/EntityEditorTarget.md)

Click-driven property editing for an inspector. Returns the **single** node or
edge the user clicked to edit — its effective label + `data` and a `commit`
that writes edits back undoably — or `null` when nothing is targeted (so a
panel can render nothing). Reads the target via [useInspectTarget](useInspectTarget.md)
(needs a `ClickInspectBehaviour`, independent of selection); commits via the
`GraphHistory` from a `<GraphHistoryProvider>` ancestor when present.

The view (`<PropertiesEditor>`) and placement (`<Panel>`) are the consumer's —
see InspectorPanel for the turnkey wiring.

## Parameters

### options?

[`UseEntityEditorOptions`](../interfaces/UseEntityEditorOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`EntityEditorTarget`](../interfaces/EntityEditorTarget.md)
