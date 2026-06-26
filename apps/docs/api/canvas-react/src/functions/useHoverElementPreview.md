# Function: useHoverElementPreview()

> **useHoverElementPreview**(`options?`, `canvas?`): `PreviewSnapshot`

Defined in: [canvas-react/src/hooks/useHoverElementPreview.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHoverElementPreview.ts#L26)

Reactive view of the **hover preview** currently surfaced by an
`HoverElementPreviewBehaviour` — the resolved card + its anchor — or `null` when
nothing is hovered (or the behaviour isn't registered yet).

Subscribes to the behaviour's `preview:show` / `preview:move` / `preview:hide`
bus: `show` and `move` both publish the latest PreviewSnapshot (so the
card repositions as the camera pans / zooms), `hide` clears it. Pair with
[HoverElementPreviewCard](../variables/Canvas.md) to draw it, or just use [HoverElementPreviewBehaviour](../variables/Canvas.md).

Mirrors [useViewTarget](useViewTarget.md)'s late-registration handling: if the behaviour
registers *after* this hook mounts (its wrapper is a sibling whose effect runs
later), it attaches as soon as `behaviour:registered` fires for `previewId`.

## Parameters

### options?

[`UseHoverElementPreviewOptions`](../interfaces/UseHoverElementPreviewOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

`PreviewSnapshot`
