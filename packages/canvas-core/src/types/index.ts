/**
 * Core type definitions for canvas-core
 */

// ============================================================================
// Geometry Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// State Types
// ============================================================================

export type NodeState =
  | 'default'
  | 'hovered'
  | 'clicked'
  | 'selected'
  | 'highlighted'
  | 'muted'
  | 'locked'
  | 'disabled';

export type EdgeState =
  | 'default'
  | 'hovered'
  | 'clicked'
  | 'selected'
  | 'highlighted'
  | 'muted'
  | 'locked'
  | 'disabled';

// ============================================================================
// Style Types
// ============================================================================

export interface NodeStyle {
  // Shape
  shape?: NodeShapeType;
  size?: number;
  width?: number;
  height?: number;
  sides?: number; // For polygon shapes

  // Fill
  fill?: string;
  fillOpacity?: number;

  // Stroke
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;

  // Effects
  opacity?: number;
  scale?: number;
  rotation?: number;
  shadow?: ShadowStyle;
  glow?: GlowStyle;

  // Animation
  animation?: AnimationConfig;

  // Label
  label?: LabelStyle;
}

export interface EdgeStyle {
  // Shape
  type?: EdgeShapeType;

  // Line
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  lineDash?: number[];

  // Arrow heads
  sourceArrow?: ArrowHeadConfig;
  targetArrow?: ArrowHeadConfig;

  // Effects
  opacity?: number;
  shadow?: ShadowStyle;
  glow?: GlowStyle;

  // Animation
  animation?: AnimationConfig;

  // Label
  label?: LabelStyle;
}

export interface LabelStyle {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fill?: string;
  opacity?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  offsetX?: number;
  offsetY?: number;
  visible?: boolean;
  background?: string;
  padding?: number;
  borderRadius?: number;
}

export interface ShadowStyle {
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface GlowStyle {
  color?: string;
  blur?: number;
  strength?: number;
}

// ============================================================================
// Shape Types
// ============================================================================

export type NodeShapeType =
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'roundedRectangle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'custom';

export type EdgeShapeType =
  | 'straight'
  | 'bezier'
  | 'quadratic'
  | 'orthogonal'
  | 'arc'
  | 'custom';

export type ArrowHeadType =
  | 'none'
  | 'triangle'
  | 'triangleFilled'
  | 'circle'
  | 'circleFilled'
  | 'square'
  | 'squareFilled'
  | 'diamond'
  | 'diamondFilled'
  | 'chevron';

export interface ArrowHeadConfig {
  type: ArrowHeadType;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// ============================================================================
// Animation Types
// ============================================================================

export type AnimationType =
  | 'none'
  | 'pulse'
  | 'breathe'
  | 'shake'
  | 'bounce'
  | 'rotate'
  | 'blink'
  | 'ripple'
  | 'glow';

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce';

export interface AnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  easing?: EasingType;
  loop?: boolean | number;
  intensity?: number;
}

// ============================================================================
// State Styles
// ============================================================================

export interface NodeStateStyles {
  default: NodeStyle;
  hovered?: Partial<NodeStyle>;
  clicked?: Partial<NodeStyle>;
  selected?: Partial<NodeStyle>;
  highlighted?: Partial<NodeStyle>;
  muted?: Partial<NodeStyle>;
  locked?: Partial<NodeStyle>;
  disabled?: Partial<NodeStyle>;
}

export interface EdgeStateStyles {
  default: EdgeStyle;
  hovered?: Partial<EdgeStyle>;
  clicked?: Partial<EdgeStyle>;
  selected?: Partial<EdgeStyle>;
  highlighted?: Partial<EdgeStyle>;
  muted?: Partial<EdgeStyle>;
  locked?: Partial<EdgeStyle>;
  disabled?: Partial<EdgeStyle>;
}

// ============================================================================
// Data Types
// ============================================================================

export interface NodeData<T = Record<string, unknown>> {
  id: string;
  type?: string;
  label?: string;
  x?: number;
  y?: number;
  style?: Partial<NodeStyle>;
  states?: Partial<NodeStateStyles>;
  data?: T;
}

export interface EdgeData<T = Record<string, unknown>> {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  style?: Partial<EdgeStyle>;
  states?: Partial<EdgeStateStyles>;
  data?: T;
}

export interface GraphData<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> {
  nodes: NodeData<N>[];
  edges: EdgeData<E>[];
}

// ============================================================================
// Renderer Types
// ============================================================================

export type RendererType = 'webgpu' | 'webgl' | 'auto';

export interface RendererConfig {
  type?: RendererType;
  antialias?: boolean;
  resolution?: number;
  backgroundColor?: string;
  backgroundAlpha?: number;
}

// ============================================================================
// Viewport Types
// ============================================================================

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  rotation?: number;
}

export interface ViewportConfig {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  panEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface InteractionConfig {
  hover?: boolean;
  click?: boolean;
  doubleClick?: boolean;
  drag?: boolean;
  select?: boolean;
  multiSelect?: boolean;
  pan?: boolean;
  zoom?: boolean;
  contextMenu?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface CanvasEvent<T = unknown> {
  type: string;
  target?: T;
  originalEvent?: Event;
  position?: Point;
  worldPosition?: Point;
  timestamp: number;
}

export interface NodeEvent extends CanvasEvent {
  node: NodeData;
  state?: NodeState;
}

export interface EdgeEvent extends CanvasEvent {
  edge: EdgeData;
  state?: EdgeState;
}

export interface ViewportEvent extends CanvasEvent {
  viewport: ViewportState;
  previousViewport: ViewportState;
}

export interface SelectionEvent extends CanvasEvent {
  selectedNodes: string[];
  selectedEdges: string[];
  previousSelectedNodes: string[];
  previousSelectedEdges: string[];
}

// ============================================================================
// Canvas Configuration
// ============================================================================

export interface CanvasConfig {
  container: HTMLElement | string;
  width?: number;
  height?: number;
  autoResize?: boolean;

  renderer?: RendererConfig;
  viewport?: ViewportConfig;
  interactions?: InteractionConfig;

  data?: GraphData;
}

// ============================================================================
// Serialization Types
// ============================================================================

export interface CanvasSnapshot {
  version: string;
  timestamp: number;

  // Graph data
  nodes: NodeData[];
  edges: EdgeData[];

  // View state
  viewport: ViewportState;

  // Selection state
  selectedNodes: string[];
  selectedEdges: string[];

  // Plugin states
  plugins: Record<string, unknown>;
}
