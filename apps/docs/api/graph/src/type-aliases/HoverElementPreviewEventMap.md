# Type Alias: HoverElementPreviewEventMap

> **HoverElementPreviewEventMap** = `object`

Event-map for [HoverElementPreviewBehaviour.events](../classes/HoverElementPreviewBehaviour.md#events).

## Properties

### preview:hide

> **preview:hide**: `null`

Fired when the card should disappear.

***

### preview:move

> **preview:move**: [`PreviewSnapshot`](PreviewSnapshot.md)

Fired when the anchored card must reposition (camera pan / zoom).

***

### preview:show

> **preview:show**: [`PreviewSnapshot`](PreviewSnapshot.md)

Fired after the dwell delay once an element's card should appear.
