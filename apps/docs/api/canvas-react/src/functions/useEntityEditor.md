# Function: useEntityEditor()

> **useEntityEditor**(`options?`, `canvas?`): [`EntityEditorTarget`](../interfaces/EntityEditorTarget.md)

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L77)

Click-driven property editing for an inspector. Returns the **single** node or
edge the user clicked to edit — its effective label + `data` and a `commit`
that writes edits back undoably — or `null` when nothing is targeted (so a
panel can render nothing). Reads the target via [useInspectTarget](useInspectTarget.md)
(needs a `ClickInspectBehaviour`, independent of selection); commits via the
`GraphHistory` from a `<GraphHistoryProvider>` ancestor when present.

The view (`<PropertiesEditor>`) and placement (`<Panel>`) are the consumer's —
see [InspectorPanel](../variables/Canvas.md) for the turnkey wiring.

## Parameters

### options?

[`UseEntityEditorOptions`](../interfaces/UseEntityEditorOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`EntityEditorTarget`](../interfaces/EntityEditorTarget.md)
