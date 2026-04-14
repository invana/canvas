/**
 * @invana/canvas-core
 * 
 * High-performance canvas rendering engine with WebGPU-first design.
 * 
 * ## Architecture Overview
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Canvas (core/)                              │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
 * │  │ Viewport │  │  Layers  │  │  Scene   │  │  Processors   │   │
 * │  │(pan/zoom)│  │ Manager  │  │  Graph   │  │   Pipeline    │   │
 * │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │
 * │                      │             │              │              │
 * │                 ┌────┴─────────────┴──────────────┘              │
 * │                 ▼                                                │
 * │         ┌───────────────────┐    ┌─────────────┐                │
 * │         │ Function-Based    │    │  Rendering  │                │
 * │         │    Styling        │    │  (Registry) │                │
 * │         └───────────────────┘    └─────────────┘                │
 * └─────────────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Elements (elements/)                         │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐          │
 * │  │RendererNodeBase│  │RendererEdgeBase│  │    RendererBase    │          │
 * │  │  (nodes/)   │  │  (edges/)   │  │                 │          │
 * │  └─────────────┘  └─────────────┘  └─────────────────┘          │
 * └─────────────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Primitives (primitives/)                     │
 * │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
 * │  │ shapes │  │ paths  │  │ arrows │  │ labels │  │effects │    │
 * │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │
 * │  (Pure functions - all PixiJS Graphics calls here)              │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
 * 
 * const canvas = new Canvas({
 *   container: document.getElementById('app')!,
 *   width: 1200,
 *   height: 800,
 * });
 * 
 * await canvas.init();
 * 
 * // Add graph visualization plugin
 * const graphPlugin = new GraphDataPlugin();
 * await canvas.registerPlugin(graphPlugin);
 * 
 * // Render nodes and edges
 * graphPlugin.setData({
 *   nodes: [
 *     { id: 'n1', x: 100, y: 200, shape: 'circle', label: 'Node 1' },
 *     { id: 'n2', x: 400, y: 200, shape: 'roundedRect', label: 'Node 2' },
 *   ],
 *   edges: [
 *     { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
 *   ],
 * });
 * ```
 */

// ============================================================================
// CORE
// ============================================================================

export { Canvas } from './core';
export type { 
  CanvasOptions,
  CanvasState
} from './core';

// ============================================================================
// VIEWPORT
// ============================================================================

export { Viewport } from './viewport';
export type { ViewportOptions, ViewportState, ViewportAnimationEffectTiming } from './viewport';

// ============================================================================
// RENDERING
// ============================================================================

export { Registry, Renderer } from './rendering';
export type { 
  BuiltInShapeType, 
  BuiltInPathType, 
  ShapeDrawer, 
  PathDrawer,
  RendererOptions,
  // Public API types
  CanvasNode,
  CanvasEdge,
  Point
} from './rendering';

// ============================================================================
// LAYERS
// ============================================================================

export { Layer, LayerManager, LayerGroup } from './layers';

// ============================================================================
// PLUGINS
// ============================================================================

export type { 
  CanvasPlugin,
  LayerType,
  LayerConfig,
  LayerGroupConfig, 
  PluginRegistrationOptions, 
  PluginConfig, 
  PluginConfigWithOptions,
  BehaviorPreset 
} from './plugins/types';
export { PluginRegistry, BEHAVIOR_PRESETS, type PluginConstructor } from './plugins/registry';

// Core plugins
export { GraphDataPlugin } from './plugins/GraphDataPlugin';
export type { GraphData, GraphStyles, GraphDataPluginOptions } from './plugins/GraphDataPlugin';

export { GroupsPlugin } from './plugins/GroupsPlugin';
export type { GroupConfig } from './plugins/GroupsPlugin';
export { BackgroundPlugin } from './plugins/BackgroundPlugin';

// Interaction plugins
export { DragElementPlugin, type DragElementOptions } from './plugins/DragElementPlugin';
export { DragCanvasPlugin, type DragCanvasOptions } from './plugins/DragCanvasPlugin';
export { ZoomControlPlugin, type ZoomControlOptions } from './plugins/ZoomControlPlugin';
export { ClickSelectPlugin, type ClickSelectOptions } from './plugins/ClickSelectPlugin';
export type { SelectableElement } from './plugins/ClickSelectPlugin';
export { HoverActivatePlugin, type HoverActivateOptions, type HoverDirection } from './plugins/HoverActivatePlugin';
export type { HoverableElement } from './plugins/HoverActivatePlugin';
export { FocusElementPlugin, type FocusElementOptions } from './plugins/FocusElementPlugin';
export type { FocusableElement } from './plugins/FocusElementPlugin';
export { MiniMapPlugin, type MiniMapOptions } from './plugins/MiniMapPlugin';

// ============================================================================
// STYLE
// ============================================================================

// Function-based styling - RECOMMENDED
export { 
  resolveNodeStyle,
  resolveEdgeStyle,
  type FunctionBasedNodeStyle,
  type FunctionBasedEdgeStyle,
  type StyleValue
} from './style/FunctionBasedStyle';

// State management constants
export { NodeStates, EdgeStates, KNOWN_NODE_STATES, KNOWN_EDGE_STATES } from './types/states';
export type { NodeStateName, EdgeStateName } from './types/states';

// Default styling
export {
  DEFAULT_NODE_STATE_STYLES,
  DEFAULT_NODE_STATE_PRIORITY,
} from './defaults/nodes';
export {
  DEFAULT_EDGE_STATE_STYLES,
  DEFAULT_EDGE_STATE_PRIORITY,
} from './defaults/edges';
export {
  DEFAULT_CANVAS_BACKGROUND,
  DEFAULT_CANVAS_GRID,
  DEFAULT_CANVAS_VIEWPORT,
  DEFAULT_CANVAS_INTERACTION,
} from './defaults/canvas';

// ============================================================================
// PROCESSORS
// ============================================================================

export { 
  BaseProcessor, 
  ProcessorPipeline, 
  ProcessorRegistry,
  LoggingProcessor,
  SelectionProcessor,
  HighlightNeighborsProcessor,
  ZoomLevelProcessor,
} from './processors';
export type { 
  FunctionalProcessor, 
  ProcessorConstructor 
} from './processors';
export type { ProcessorConfig, ProcessorContext } from './types';
export type {
  CanvasEventMap,
  CanvasPointerPosition,
  NodePointerEvent,
  NodeDragEvent,
  NodeSelectionEvent,
  EdgePointerEvent,
  EdgeSelectionEvent,
  SelectionChangedEvent,
  CanvasBgPointerEvent,
  ViewportZoomEvent,
  ViewportPanEvent,
} from './types';

// ============================================================================
// ELEMENTS
// ============================================================================

export {
  RendererBase,
  // Node shapes
  RendererNodeBase,
  CircleNode,
  EllipseNode,
  RectNode,
  HTMLNode,
  PolygonNode,
  TriangleNode,
  DiamondNode,
  PentagonNode,
  HexagonNode,
  OctagonNode,
  // Edge shapes
  RendererEdgeBase,
  LineEdge,
  BezierEdge,
  OrthogonalEdge,
} from './elements';

export type {
  RendererBaseData,
  RendererBaseStyle,
  RendererBaseOptions,
  RendererNode as ElementNodeData,
  NodeStyle as ElementNodeStyle,
  NodeShapeOptions,
  NodeShapeType,
  RendererEdge as ElementEdgeData,
  EdgeStyle as ElementEdgeStyle,
  EdgeShapeOptions,
  EdgePathType,
} from './elements';

// ============================================================================
// TYPES
// ============================================================================

export type {
  Bounds,
  Tangent,
  CanvasEventType,
  CanvasEvent,
  NodeInstance,
  EdgeInstance,
  ShapeInstance,
  BackgroundStyle,
  SolidBackground,
  GradientBackground,
  PatternBackground,
  BackgroundType,
  PatternType,
  GradientType,
} from './types';

// ============================================================================
// UTILS
// ============================================================================

export { EventEmitter } from './utils';
export type { EventCallback } from './utils';

// ============================================================================
// PRIMITIVES
// ============================================================================

// Re-export primitives for advanced usage
export * from './primitives';

// ============================================================================
// DEFAULTS
// ============================================================================

// Re-export default configurations
export {
  // Node defaults (single source of truth)
  DEFAULT_NODE_STYLE,
  
  // Edge defaults (single source of truth)
  DEFAULT_EDGE_STYLE,
  
  // Label defaults
  DEFAULT_LABEL_STYLE,
  DEFAULT_LABEL_POSITION,
  DEFAULT_LABEL_OFFSET,
  LABEL_VARIANTS,
} from './defaults';
