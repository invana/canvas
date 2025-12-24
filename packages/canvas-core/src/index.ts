/**
 * @aspect-ui/canvas-core
 *
 * High-performance WebGPU-first canvas rendering engine
 */

// Core
export { Canvas, Viewport } from './core/index.js';
export type { CanvasOptions } from './core/index.js';

// Graph
export { Graph } from './graph/index.js';

// Renderer
export { PixiRenderer } from './renderer/index.js';
export type { IRenderer } from './renderer/index.js';

// State
export {
  StateManager,
  NodeStateManager,
  EdgeStateManager,
  SelectionManager,
} from './state/index.js';
export type {
  StateChangeHandler,
  SelectionChangeHandler,
  SelectionManagerConfig,
} from './state/index.js';

// Events
export { EventEmitter, CanvasEvents } from './events/index.js';
export type { EventHandler, CanvasEventType } from './events/index.js';

// Interaction
export { InteractionManager } from './interaction/index.js';
export type { InteractionManagerConfig } from './interaction/index.js';

// Theming
export { ThemeManager, lightTheme, darkTheme } from './theming/index.js';

// Plugins
export { PluginManager, BasePlugin } from './plugins/index.js';

// Shapes - Nodes
export {
  BaseNodeShape,
  CircleNode,
  RectangleNode,
  PolygonNode,
} from './shapes/nodes/index.js';
export type { NodeShapeConfig } from './shapes/nodes/index.js';

// Shapes - Edges
export {
  BaseEdgeShape,
  StraightEdge,
  BezierEdge,
  OrthogonalEdge,
} from './shapes/edges/index.js';
export type { EdgeShapeConfig, EdgeEndpoints } from './shapes/edges/index.js';

// Types
export type {
  // Geometry
  Point,
  Size,
  Bounds,

  // States
  NodeState,
  EdgeState,

  // Styles
  NodeStyle,
  EdgeStyle,
  LabelStyle,
  ShadowStyle,
  GlowStyle,
  NodeStateStyles,
  EdgeStateStyles,

  // Shapes
  NodeShapeType,
  EdgeShapeType,
  ArrowHeadType,
  ArrowHeadConfig,

  // Animation
  AnimationType,
  EasingType,
  AnimationConfig,

  // Data
  NodeData,
  EdgeData,
  GraphData,

  // Renderer
  RendererType,
  RendererConfig,

  // Viewport
  ViewportState,
  ViewportConfig,

  // Interaction
  InteractionConfig,

  // Events
  CanvasEvent,
  NodeEvent,
  EdgeEvent,
  ViewportEvent,
  SelectionEvent,

  // Canvas
  CanvasConfig,
  CanvasSnapshot,
} from './types/index.js';

export type {
  Theme,
  ThemeName,
  ThemeColors,
  AutoColorConfig,
} from './types/theme.js';

export type {
  Plugin,
  PluginContext,
  PluginConstructor,
  PluginInfo,
} from './types/plugin.js';
