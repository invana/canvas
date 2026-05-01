// ============================================================
// @invana/canvas  — public API
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
export { BackgroundPlugin, ThemedBackgroundPlugin, DrawingPlugin, DevInfoPlugin } from './plugins/builtin/index.js';
export type { CustomShapeFn } from './plugins/builtin/DrawingPlugin.js';
export type { BackgroundOptions, BackgroundType, PatternType, ThemedBackgroundOptions, ThemedBackgroundTheme, ThemedBackgroundMode, ThemedBackgroundKind, DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from './plugins/builtin/index.js';
export type { DevInfoPluginOptions, DevInfoCorner } from './plugins/builtin/index.js';

// PixiJS re-exports needed by consumers (e.g. gradient fills)
export { FillGradient } from 'pixi.js';

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
  CanvasResizeEvent,
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

// Background event classes (owned by BackgroundPlugin / ThemedBackgroundPlugin — augment CanvasEventMap)
export { BackgroundUpdatedEvent, ThemedBackgroundThemeSwitchedEvent, ThemedBackgroundModeUpdatedEvent } from './plugins/builtin/index.js';
export type { ThemeSwitchSource, ModeUpdateSource } from './plugins/builtin/index.js';

// Event map type (augmentable interface)
export type { CanvasEventMap } from './types/events.js';

// Shared types
export type { Point, Bounds, Size, CanvasOptions, PluginConfig } from './types/index.js';

// EventEmitter utility (for plugin authors)
export { EventEmitter } from './utils/index.js';

// Graphics utilities (for advanced plugin authors / plugins-graph-data internal use)
export {
  drawCircle, drawRect, drawEllipse, drawPolygon, drawPolyline, drawStar,
  buildPolygonPoints, buildStarPoints,
} from './graphics-utils/shapes/index.js';
export {
  drawTriangleArrow, drawTriangleOutlineArrow,
  drawDiamondArrow, drawDiamondOutlineArrow,
  drawCircleArrow, drawCircleOutlineArrow,
  drawSquareArrow, drawSquareOutlineArrow,
  drawClassicArrow, drawBlockArrow,
  drawEllipseArrow, drawCrossArrow,
  drawAsyncArrow, drawCirclePlusArrow,
} from './graphics-utils/arrows/index.js';
export { resolveFillArg } from './graphics-utils/types.js';
export type { DrawContext as GraphicsDrawContext, PathCommand as GraphicsPathCommand } from './drawing/DrawContext.js';
export type { BezierPoint as GraphicsBezierPoint } from './graphics-utils/paths/index.js';

// Pure-math geometry primitives — used by plugins that need ray/boundary/flatten ops.
export {
  rayVsSegment, rayVsCircle, rayVsEllipse, rayVsRect, rayVsPolyline,
  rayPointAt, unit,
  flattenCubic, flattenQuadratic, flattenPath,
} from './graphics-utils/geometry/index.js';
export type { RayPolylineHit } from './graphics-utils/geometry/index.js';
