/**
 * Core type definitions for canvas-core
 */

import type { Container, Graphics } from 'pixi.js';

// Export state management types
export * from './states';

// =============================================================================
// Point & Geometry Types
// =============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tangent {
  angle: number;
  point: Point;
}

// =============================================================================
// Event Types
// =============================================================================

export type CanvasEventType =
  | 'node:added'
  | 'node:updated'
  | 'node:removed'
  | 'node:selected'
  | 'node:deselected'
  | 'node:clicked'
  | 'node:dblclicked'
  | 'node:contextmenu'
  | 'node:dragstart'
  | 'node:drag'
  | 'node:dragend'
  | 'node:hover'
  | 'node:hoverend'
  | 'edge:added'
  | 'edge:updated'
  | 'edge:removed'
  | 'edge:selected'
  | 'edge:deselected'
  | 'edge:clicked'
  | 'edge:dblclicked'
  | 'edge:hover'
  | 'edge:hoverend'
  | 'canvas:clicked'
  | 'canvas:dblclicked'
  | 'canvas:contextmenu'
  | 'viewport:changed'
  | 'viewport:zoomed'
  | 'viewport:panned'
  | 'selection:changed'
  | 'render:complete';

export interface CanvasEvent<T = unknown> {
  type: CanvasEventType;
  target?: T;
  data?: unknown;
  originalEvent?: Event;
  timestamp: number;
}

// =============================================================================
// Typed Event Map — used by Canvas.events (EventEmitter<CanvasEventMap>)
// Forward-declare element types to avoid circular imports at runtime.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRendererNodeBase = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRendererEdgeBase = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFederatedPointerEvent = any;

export interface CanvasPointerPosition {
  /** Screen (pixel) coordinates relative to the canvas element */
  screen: { x: number; y: number };
  /** World (canvas) coordinates */
  world: { x: number; y: number };
}

export interface NodePointerEvent {
  node: AnyRendererNodeBase;
  position: CanvasPointerPosition;
  originalEvent: AnyFederatedPointerEvent;
}

export interface NodeDragEvent {
  node: AnyRendererNodeBase;
  x: number;
  y: number;
}

export interface NodeSelectionEvent {
  node: AnyRendererNodeBase;
}

export interface EdgePointerEvent {
  edge: AnyRendererEdgeBase;
  position: CanvasPointerPosition;
  originalEvent: AnyFederatedPointerEvent;
}

export interface EdgeSelectionEvent {
  edge: AnyRendererEdgeBase;
}

export interface SelectionChangedEvent {
  nodes: AnyRendererNodeBase[];
  edges: AnyRendererEdgeBase[];
}

export interface CanvasBgPointerEvent {
  position: CanvasPointerPosition;
  originalEvent: AnyFederatedPointerEvent | Event;
}

export interface ViewportZoomEvent {
  scale: number;
}

export interface ViewportPanEvent {
  x: number;
  y: number;
}

export interface CanvasEventMap {
  'node:clicked':        NodePointerEvent;
  'node:dblclicked':     NodePointerEvent;
  'node:contextmenu':    NodePointerEvent;
  'node:hover':          NodePointerEvent;
  'node:hoverend':       NodePointerEvent;
  'node:dragstart':      NodeDragEvent;
  'node:drag':           NodeDragEvent;
  'node:dragend':        NodeDragEvent;
  'node:selected':       NodeSelectionEvent;
  'node:deselected':     NodeSelectionEvent;
  'edge:clicked':        EdgePointerEvent;
  'edge:dblclicked':     EdgePointerEvent;
  'edge:hover':          EdgePointerEvent;
  'edge:hoverend':       EdgePointerEvent;
  'edge:selected':       EdgeSelectionEvent;
  'edge:deselected':     EdgeSelectionEvent;
  'canvas:clicked':      CanvasBgPointerEvent;
  'canvas:dblclicked':   CanvasBgPointerEvent;
  'canvas:contextmenu':  CanvasBgPointerEvent;
  'selection:changed':   SelectionChangedEvent;
  'viewport:zoomed':     ViewportZoomEvent;
  'viewport:panned':     ViewportPanEvent;
}

// =============================================================================
// Layer Types
// =============================================================================

export type LayerType = 'background' | 'edges' | 'nodes' | 'labels' | 'overlay' | 'custom';

export interface LayerConfig {
  name: string;
  type: LayerType;
  zIndex: number;
  visible?: boolean;
  interactive?: boolean;
}

// =============================================================================
// Processor Types
// =============================================================================

export interface ProcessorConfig {
  type: string;
  options?: Record<string, unknown>;
  enabled?: boolean;
  priority?: number;
}

export interface ProcessorContext {
  canvas: unknown; // Will be Canvas type
  sceneGraph: unknown; // Will be SceneGraph type
  event?: CanvasEvent;
}

// Note: CanvasOptions is now exported from Canvas.ts

// =============================================================================
// Shape Instance Types  
// =============================================================================
// 
// Shape Instance Interfaces
// These use 'any' for data types to allow flexibility across different shape implementations

export interface ShapeInstance {
  id: string;
  container: Container;
  graphics: Graphics;
  data: any;
  update(data: any): void;
  destroy(): void;
}

export interface NodeInstance extends ShapeInstance {
  data: any;
  getBoundaryPoint(angle: number): Point;
  setSelected(selected: boolean): void;
  setHovered(hovered: boolean): void;
}

export interface EdgeInstance extends ShapeInstance {
  data: any;
  sourceNode: NodeInstance;
  targetNode: NodeInstance;
  setSelected(selected: boolean): void;
  setHovered(hovered: boolean): void;
}

// =============================================================================
// Background Types
// =============================================================================

export type BackgroundType = 'solid' | 'gradient' | 'pattern';
export type PatternType = 'dots' | 'grid' | 'cross' | 'lines';
export type GradientType = 'linear' | 'radial';

export interface SolidBackground {
  type: 'solid';
  color: string | number;
  alpha?: number;
}

export interface GradientBackground {
  type: 'gradient';
  gradientType: GradientType;
  colors: Array<{ color: string | number; offset: number }>;
  /** For linear gradient: angle in degrees (0 = horizontal right, 90 = vertical down) */
  angle?: number;
  /** For linear gradient: start and end points (overrides angle) */
  start?: Point;
  end?: Point;
  /** For radial gradient: center point (defaults to canvas center) */
  center?: Point;
  /** For radial gradient: radius (defaults to canvas diagonal) */
  radius?: number;
  alpha?: number;
}

export interface PatternBackground {
  type: 'pattern';
  patternType: PatternType;
  /** Primary color for the pattern */
  color: string | number;
  /** Background color (defaults to transparent) */
  backgroundColor?: string | number;
  /** Size of pattern elements (e.g., dot radius, grid spacing) */
  size?: number;
  /** Spacing between pattern elements */
  spacing?: number;
  /** Line width for grid/cross/lines patterns */
  lineWidth?: number;
  /** Opacity of the pattern */
  alpha?: number;
  /** Opacity of the background */
  backgroundAlpha?: number;
  /** 
   * Whether the pattern should follow viewport pan/zoom.
   * - true: Pattern moves with viewport (nodes stay relative to pattern - "camera moves")
   * - false: Pattern stays fixed to screen (default)
   */
  follow?: boolean;
}

export type BackgroundStyle = SolidBackground | GradientBackground | PatternBackground;
