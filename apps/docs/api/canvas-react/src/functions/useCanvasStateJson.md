# Function: useCanvasStateJson()

> **useCanvasStateJson**(`canvas?`): `UseCanvasStateJsonResult`

Export / import the **full canvas state** (view definition + interaction +
per-layer data) as JSON — the state counterpart to
[useCanvasImageExport](useCanvasImageExport.md) (which handles *images*).

A thin React binding over the engine's framework-agnostic helpers
([Canvas.exportState](../../../graph/src/classes/GraphCanvas.md#exportstate) / Canvas.stateToJSON /
[Canvas.downloadState](../../../graph/src/classes/GraphCanvas.md#downloadstate) / [Canvas.importStateFrom](../../../graph/src/classes/GraphCanvas.md#importstatefrom)): `export` /
`toJSON` read the current state, `download` saves it as a `.json` file, and
`import` restores from a snapshot, a JSON string, or a picked `File`.
Multi-canvas-safe via the optional `canvas` argument (falls back to the
`<Canvas>` context).

## Parameters

### canvas?

`Canvas`

## Returns

`UseCanvasStateJsonResult`

## Example

```ts
const { download, import: importState } = useCanvasStateJson();
<button onClick={() => download('scene.json')}>Save</button>
<input type="file" accept="application/json"
       onChange={(e) => e.target.files?.[0] && importState(e.target.files[0])} />
```
