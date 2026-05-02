// ── @invana/plugins-graph-data-deprecated public exports ─────────────────────────────────
// This package now re-exports everything from @invana/plugins-shapes-deprecated and
// adds GraphDataPlugin on top.

// Re-export all of @invana/plugins-shapes-deprecated
export * from '@invana/plugins-shapes-deprecated';

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
  TraversalDirection,
} from './graph-types.js';

// ── State stores (shared by behaviour plugins) ────────────────────────────────
export { HoverStore, SelectionStore } from './state/index.js';
export type {
  HoverElementType,
  HoverStoreEvents,
  SelectionElementType,
  SelectionSnapshot,
  SelectionStoreEvents,
} from './state/index.js';

// ── Behaviour plugins (opt-in — register explicitly) ──────────────────────────
export { HoverActivatePlugin, ClickSelectPlugin, BrushSelectPlugin, LassoSelectPlugin, MiniMapPlugin } from './plugins/index.js';
export type {
  HoverActivatePluginOptions,
  HoverableElement,
  HoverableElementType,
  HoverDirection,
  ClickSelectPluginOptions,
  SelectableElement,
  SelectableElementType,
  SelectDirection,
  SelectModifierKey,
  BrushSelectPluginOptions,
  BrushSelectElementType,
  BrushSelectStyle,
  BrushModifierKey,
  LassoSelectPluginOptions,
  LassoSelectElementType,
  LassoSelectStyle,
  LassoModifierKey,
  MiniMapPluginOptions,
  MiniMapPosition,
} from './plugins/index.js';

// ── CanvasEventMap augmentation (graph:* events kept for backward compat) ─────
// Shape:* augmentation is already included via @invana/plugins-shapes-deprecated re-export.
// graph:* events come from plugins-shapes backward-compat aliases in ShapeEvents.
