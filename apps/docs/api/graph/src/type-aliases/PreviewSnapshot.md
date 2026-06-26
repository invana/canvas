# Type Alias: PreviewSnapshot\<DN, DE\>

> **PreviewSnapshot**\<`DN`, `DE`\> = `object` & \{ `kind`: `"node"`; `node`: [`GraphNode`](../interfaces/GraphNode.md)\<`DN`\>; \} \| \{ `edge`: [`GraphEdge`](../interfaces/GraphEdge.md)\<`DE`\>; `kind`: `"edge"`; \}

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:203](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L203)

What `preview:show` / `preview:move` carry — the hovered element + its
resolved card + anchor. Discriminated on `kind`, so `snapshot.node` /
`snapshot.edge` is the properly-typed live `GraphNode` / `GraphEdge` record
(edges expose `source` / `target`, nodes `position`, …), consistent with the
rest of `@invana/graph`. The consumer positions the card at `screen`.

## Type Declaration

### card

> **card**: [`ResolvedPreviewCard`](../interfaces/ResolvedPreviewCard.md)

Resolved, render-ready card.

### id

> **id**: `string`

Element id (mirrors `node.id` / `edge.id`).

### placement

> **placement**: [`PreviewPlacement`](PreviewPlacement.md)

Configured placement hint, so the consumer offsets the card consistently.

### screen

> **screen**: `object`

Anchor in screen (canvas-relative) coords, via `camera.toScreen`.

#### screen.x

> **x**: `number`

#### screen.y

> **y**: `number`

### world

> **world**: `object`

Anchor in world (scene) coords — node centre, or the hover point for edges.

#### world.x

> **x**: `number`

#### world.y

> **y**: `number`

## Type Parameters

### DN

`DN` = `unknown`

### DE

`DE` = `unknown`
