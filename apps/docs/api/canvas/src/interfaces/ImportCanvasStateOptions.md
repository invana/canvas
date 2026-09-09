# Interface: ImportCanvasStateOptions

Options for [importCanvasState](../functions/importCanvasState.md).

## Properties

### skipInteraction?

> `optional` **skipInteraction?**: `boolean`

Skip restoring the ephemeral `interaction` slice (selection / hover /
camera / focus / view states). Default `false` — the full live view is
restored. Set `true` to load a document's definition + data while keeping
the viewer's current camera and selection.
