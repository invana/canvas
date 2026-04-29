// ── @invana/plugins-graph-data public exports ─────────────────────────────────
// This package now re-exports everything from @invana/plugins-shapes and
// adds GraphDataPlugin on top.

// Re-export all of @invana/plugins-shapes
export * from '@invana/plugins-shapes';

// ── GraphDataPlugin (high-level API) ──────────────────────────────────────────
export { GraphDataPlugin } from './GraphDataPlugin.js';
export type {
  INodeData,
  IEdgeData,
  ICanvasData,
  IGraphStyles,
  INodeStyle,
  IEdgeStyle,
  GraphDataPluginOptions,
  NodeShape,
  EdgePathType,
} from './graph-types.js';

// ── CanvasEventMap augmentation (graph:* events kept for backward compat) ─────
// Shape:* augmentation is already included via @invana/plugins-shapes re-export.
// graph:* events come from plugins-shapes backward-compat aliases in ShapeEvents.
