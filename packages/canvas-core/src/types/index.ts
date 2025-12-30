/**
 * Core type definitions for canvas-core
 */

import type { Container, Graphics } from 'pixi.js';

// Export state management types
export * from './states';

// =============================================================================
// LEGACY TYPES - REMOVED
// =============================================================================
// 
// RendererNode, NodeStyle, EdgeData, EdgeStyle have been removed.
// Use proper types from ./elements instead:
//   - RendererNode -> ElementNodeData
//   - NodeStyle -> ElementNodeStyle  
//   - EdgeData -> ElementEdgeData
//   - EdgeStyle -> ElementEdgeStyle
//
// Old types had legacy selectedFill/hoverFill properties.
// New types use proper state-based styling with states.selected, etc.

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

// =============================================================================
// Style & Theme Types (Legacy - not used in new function-based styling)
// =============================================================================

// =============================================================================
// Canvas Options
// =============================================================================

export interface CanvasOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  // Feature flags
  enableDragging?: boolean;
  enableSelection?: boolean;
  enableHover?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  // Limits
  minZoom?: number;
  maxZoom?: number;
  // Processors
  processors?: ProcessorConfig[];
  // Layers
  layers?: LayerConfig[];
}

// =============================================================================
// Shape Instance Types  
// =============================================================================
// 
// LEGACY: These interfaces reference old RendererNode/EdgeData which have been removed.
// TODO: Refactor to use ElementNodeData/ElementEdgeData from ./elements
// For now, using 'any' to unblock the build

export interface ShapeInstance {
  id: string;
  container: Container;
  graphics: Graphics;
  data: any; // LEGACY: was RendererNode | EdgeData
  update(data: any): void; // LEGACY: was Partial<NodeData | EdgeData>
  destroy(): void;
}

export interface NodeInstance extends ShapeInstance {
  data: any; // LEGACY: was RendererNode
  getBoundaryPoint(angle: number): Point;
  setSelected(selected: boolean): void;
  setHovered(hovered: boolean): void;
}

export interface EdgeInstance extends ShapeInstance {
  data: any; // LEGACY: was EdgeData
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
