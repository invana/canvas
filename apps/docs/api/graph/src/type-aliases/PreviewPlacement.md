# Type Alias: PreviewPlacement

> **PreviewPlacement** = `"auto"` \| `"top"` \| `"right"` \| `"bottom"` \| `"left"` \| `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L70)

Where the card anchors relative to the element — a hint passed through to the
consumer in [PreviewSnapshot.placement](PreviewSnapshot.md).

`'auto'` defers the side choice to the consumer: only the consumer renders
the card, so only it knows the card's size and the viewport bounds needed to
flip the card inward near a screen corner/edge and clamp it on-screen. The
headless behaviour never measures the card, so it can't resolve `'auto'`
itself — it emits the anchor (`screen`) and the hint, and the
consumer's positioner does the collision-aware flip + clamp.
