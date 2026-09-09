# Function: useResolvedCanvas()

> **useResolvedCanvas**(`explicit?`): `Canvas`

Resolve the engine `Canvas` a hook should act on. Prefers an explicit
instance (for the out-of-`<Canvas>` / multi-canvas-orchestration case), and
otherwise reads the instance-scoped [CanvasContext](../variables/CanvasContext.md). Throws only when
neither is available — so calling a canvas hook outside any `<Canvas>` and
without an explicit instance fails loudly instead of silently no-op'ing.

This is what keeps every hook multi-canvas-safe: inside a `<Canvas>` tree the
context yields *that* instance; passing an explicit `canvas` targets a
specific one. There is no global fallback.

## Parameters

### explicit?

`Canvas`

## Returns

`Canvas`
