# Interface: NodeResizeOptions

The serialisable subset of `NodeResizeBehaviourOptions` this editor produces.
Colours stay as engine numbers (`handleFill`, `frameColor`); `dashArray` keeps
its `[dash, gap]` tuple shape.

## Properties

### dashArray?

> `optional` **dashArray?**: readonly \[`number`, `number`\]

Dash pattern `[dashLength, gapLength]` in px.

***

### frameColor?

> `optional` **frameColor?**: `number`

Frame border + handle outline colour as an engine `0xRRGGBB` number.

***

### framePadding?

> `optional` **framePadding?**: `number`

***

### handleFill?

> `optional` **handleFill?**: `number`

Handle fill colour as an engine `0xRRGGBB` number.

***

### handleRadius?

> `optional` **handleRadius?**: `number`

***

### minSize?

> `optional` **minSize?**: `number`
