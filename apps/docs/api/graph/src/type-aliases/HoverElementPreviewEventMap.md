# Type Alias: HoverElementPreviewEventMap

> **HoverElementPreviewEventMap** = `object`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:220](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L220)

Event-map for [HoverElementPreviewBehaviour.events](../classes/HoverElementPreviewBehaviour.md#events).

## Properties

### preview:hide

> **preview:hide**: `null`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:226](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L226)

Fired when the card should disappear.

***

### preview:move

> **preview:move**: [`PreviewSnapshot`](PreviewSnapshot.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:224](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L224)

Fired when the anchored card must reposition (camera pan / zoom).

***

### preview:show

> **preview:show**: [`PreviewSnapshot`](PreviewSnapshot.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:222](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L222)

Fired after the dwell delay once an element's card should appear.
