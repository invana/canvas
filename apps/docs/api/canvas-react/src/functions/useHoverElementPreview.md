# Function: useHoverElementPreview()

> **useHoverElementPreview**(`options?`, `canvas?`): `PreviewSnapshot`

Reactive view of the **hover preview** currently surfaced by an
`HoverElementPreviewBehaviour` — the resolved card + its anchor — or `null` when
nothing is hovered (or the behaviour isn't registered yet).

Subscribes to the behaviour's `preview:show` / `preview:move` / `preview:hide`
bus: `show` and `move` both publish the latest PreviewSnapshot (so the
card repositions as the camera pans / zooms), `hide` clears it. Pair with
HoverElementPreviewCard to draw it, or just use [HoverElementPreviewBehaviour](../../../canvas/src/variables/SpecStore.md).

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
