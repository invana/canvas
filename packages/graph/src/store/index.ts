/**
 * `@invana/graph` — `GraphStore` public surface.
 *
 * The store composes `@invana/canvas` `ColumnStore` for hot fields plus
 * `Map<id, payload>` for cold fields, and layers graph-specific adjacency,
 * parent/child indices, an event bus, batching, and streaming features on
 * top. See `apps/docs/graph/data-model.md` for the user-facing description.
 */

export { GraphStore } from './GraphStore';
export type {
  EdgeDirection,
  GraphEdge,
  GraphNode,
  GraphStoreEventMap,
  GraphStoreOptions,
  Vec2,
} from './types';
