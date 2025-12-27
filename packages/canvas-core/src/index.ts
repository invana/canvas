/**
 * @aspect-ui/canvas-core
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
 * │         │   StyleManager    │    │  Rendering  │                │
 * │         │  (themes/rules)   │    │  (Registry) │                │
 * │         └───────────────────┘    └─────────────┘                │
 * └─────────────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     Elements (elements/)                         │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐          │
 * │  │ NodeShape   │  │  EdgeShape  │  │    BaseShape    │          │
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
 * import { Canvas } from '@aspect-ui/canvas-core';
 * 
 * const canvas = new Canvas({
 *   container: document.getElementById('app')!,
 *   width: 1200,
 *   height: 800,
 * });
 * 
 * await canvas.init();
 * 
 * // Render nodes and edges
 * canvas.render({
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
  CanvasData, 
  CanvasNodeData, 
  CanvasEdgeData, 
  CanvasStyles 
} from './core';

// ============================================================================
// VIEWPORT
// ============================================================================

export { Viewport } from './viewport';
export type { ViewportOptions, ViewportState } from './viewport';

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
  NodeData as RendererNodeData, 
  EdgeData as RendererEdgeData, 
  Point as RendererPoint 
} from './rendering';

// ============================================================================
// LAYERS
// ============================================================================

export { Layer, LayerManager, LayerGroup } from './layers';
export type { LayerConfig, LayerType } from './types';

// ============================================================================
// PLUGINS
// ============================================================================

export type { CanvasPlugin, LayerGroupConfig, PluginRegistrationOptions } from './plugins/types';
export { GroupsPlugin } from './plugins/GroupsPlugin';
export type { GroupConfig } from './plugins/GroupsPlugin';
export { BackgroundPlugin } from './plugins/BackgroundPlugin';

// ============================================================================
// SCENE
// ============================================================================

export { SceneGraph, QueryEngine, Relationships, SpatialIndex } from './scene';
export type { 
  SceneGraphEventType, 
  SceneGraphEventCallback,
  QueryFilter,
  QueryResult,
  RelationshipInfo,
  PathResult,
  SpatialIndexOptions,
} from './scene';
export type { Bounds as SceneBounds } from './scene';

// ============================================================================
// INTERACTION
// ============================================================================

export { 
  InteractionManager,
  SelectionManager,
  DragManager,
  HoverManager,
} from './interaction';
export type {
  InteractionConfig,
  InteractionEventType,
  InteractionEventCallback,
  SelectableElement,
  SelectionConfig,
  SelectionEventCallback,
  DragConfig,
  DragData,
  DragEventType,
  DragEventCallback,
  HoverableElement,
  HoverConfig,
  HoverEventType,
  HoverEventCallback,
} from './interaction';

// ============================================================================
// STYLE
// ============================================================================

export { StyleManager, StyleResolver, ThemeManager } from './style';
export type { ThemeConfig, StyleRule, NodeStyle, EdgeStyle } from './types';

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

// ============================================================================
// ELEMENTS
// ============================================================================

export {
  BaseShape,
  // Node shapes
  NodeShapeBase,
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
  EdgeShapeBase,
  LineEdge,
  BezierEdge,
  OrthogonalEdge,
} from './elements';

export type {
  BaseShapeData,
  BaseShapeStyle,
  BaseShapeOptions,
  NodeData as ElementNodeData,
  NodeStyle as ElementNodeStyle,
  NodeShapeOptions,
  NodeShapeType,
  EdgeData as ElementEdgeData,
  EdgeStyle as ElementEdgeStyle,
  EdgeShapeOptions,
  EdgePathType,
} from './elements';

// ============================================================================
// TYPES
// ============================================================================

export type {
  NodeData,
  EdgeData,
  Point,
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
