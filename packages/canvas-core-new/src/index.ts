// ============================================================
// @invana/canvas-core-new  — public API
// ============================================================

// Core canvas class
export { Canvas } from './core/index.js';

// Camera (interface only — no concrete class exposed)
export type { CameraAPI, CameraAnimationOptions } from './camera/index.js';

// Layer manager (interface only)
export type { Layer, LayerManager, LayerOptions } from './layers/index.js';

// Plugin system
export { PluginSystem } from './plugins/index.js';
export type { CanvasPlugin, PluginContext } from './plugins/index.js';

// Built-in plugins
export { BackgroundPlugin, DrawingPlugin, ShapePlugin, DevInfoPlugin } from './plugins/builtin/index.js';
export type { CustomShapeFn } from './plugins/builtin/DrawingPlugin.js';
export type { BackgroundOptions, BackgroundType, PatternType, DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from './plugins/builtin/index.js';
export type { ShapePluginOptions, ShapeSpec, ShapeType, ShapeAnimations } from './plugins/builtin/index.js';
export type { BreatheOptions, ColorCycleOptions, FadeInOptions, PulseOptions, MarchingAntsOptions, DashedFlowOptions, BorderGlowOptions } from './plugins/builtin/index.js';
export type { AnimationHandler, AnimSlot } from './plugins/builtin/index.js';
export { AnimationRegistry, defaultRegistry } from './plugins/builtin/index.js';
export type { DevInfoPluginOptions, DevInfoCorner } from './plugins/builtin/index.js';

// Event bus
export { EventBus } from './events/index.js';

// Base event classes (for plugin authors extending the event system)
export { CanvasEvent, CanvasPointerEvent } from './events/index.js';
export type { CanvasPointerEventFields } from './events/index.js';

// Concrete canvas event classes
export {
  CanvasPointerDownEvent,
  CanvasPointerMoveEvent,
  CanvasPointerUpEvent,
  CanvasClickedEvent,
  CanvasDblClickedEvent,
  CanvasContextMenuEvent,
} from './events/index.js';

// Concrete camera event classes
export {
  CameraZoomEvent,
  CameraPanEvent,
  CameraFitEvent,
  CameraResetEvent,
  CameraAnimateStartEvent,
  CameraAnimateEndEvent,
} from './events/index.js';

// Concrete plugin lifecycle event classes
export {
  PluginRegisteredEvent,
  PluginDestroyedEvent,
  PluginEnabledEvent,
  PluginDisabledEvent,
} from './events/index.js';

// Concrete layer event classes
export {
  LayerAddedEvent,
  LayerRemovedEvent,
  LayerVisibilityChangedEvent,
} from './events/index.js';

// Shape event classes (base + concrete — for extending and type annotations)
export {
  ShapeBaseEvent,
  ShapeDragBaseEvent,
  ShapeClickEvent,
  ShapeDblClickEvent,
  ShapeContextMenuEvent,
  ShapePointerOverEvent,
  ShapePointerOutEvent,
  ShapePointerMoveEvent,
  ShapePointerDownEvent,
  ShapePointerUpEvent,
  ShapeDragStartEvent,
  ShapeDragMoveEvent,
  ShapeDragEndEvent,
} from './plugins/builtin/shape-plugin/ShapeEvents.js';
export type { ShapeEventFields, ShapeDragEventFields } from './plugins/builtin/shape-plugin/ShapeEvents.js';

// Event map type (augmentable interface)
export type { CanvasEventMap } from './types/events.js';

// Shared types
export type { Point, Bounds, Size, CanvasOptions, PluginConfig } from './types/index.js';

// EventEmitter utility (for plugin authors)
export { EventEmitter } from './utils/index.js';
