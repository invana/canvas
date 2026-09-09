# Function: useCanvasMessage()

> **useCanvasMessage**(`canvas?`): [`UseCanvasMessageResult`](../interfaces/UseCanvasMessageResult.md)

Read + drive the shared canvas message channel from React. Subscribes to the
engine's `message` event (emitted by `Canvas.showMessage` — from anywhere:
layouts, behaviours, app code) and tracks the current line, auto-clearing it
when a `timeout` was given. `showMessage` / `clearMessage` delegate to the
engine so a push from React reaches every other subscriber too.

Resolves the engine from the (lifted) `CanvasContext` or an explicit `canvas`
arg — works from a `<Canvas>` descendant or app-shell chrome.

## Parameters

### canvas?

`Canvas`

## Returns

[`UseCanvasMessageResult`](../interfaces/UseCanvasMessageResult.md)
