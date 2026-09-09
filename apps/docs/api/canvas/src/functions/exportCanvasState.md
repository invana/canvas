# Function: exportCanvasState()

> **exportCanvasState**(`canvas`): [`CanvasStateSnapshot`](../interfaces/CanvasStateSnapshot.md)

Serialise a canvas's **full render state** to a plain JSON object — the view
definition (scene / layers / behaviours / layouts / templates / theme), the
live interaction (selection / hover / camera / focus / states / view mode),
and every data-owning layer's records (nodes / edges with positions).

The result is a pure POJO safe to `JSON.stringify`, persist, diff, or hand to
[importCanvasState](importCanvasState.md). It does **not** describe *which classes* to
register — import restores into a canvas whose layers/behaviours/layouts are
already registered under the same ids (see [importCanvasState](importCanvasState.md)).

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

## Returns

[`CanvasStateSnapshot`](../interfaces/CanvasStateSnapshot.md)

## Example

```ts
const snapshot = exportCanvasState(canvas);
localStorage.setItem('scene', JSON.stringify(snapshot));
```
