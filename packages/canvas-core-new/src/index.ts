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
export { BackgroundPlugin, DrawingPlugin } from './plugins/builtin/index.js';
export type { CustomShapeFn } from './plugins/builtin/DrawingPlugin.js';
export type { BackgroundOptions, BackgroundType, PatternType, DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from './plugins/builtin/index.js';

// Event bus + event map types
export { EventBus } from './events/index.js';
export type { CanvasEventMap } from './types/events.js';

// Shared types
export type { Point, Bounds, Size, CanvasOptions, PluginConfig } from './types/index.js';

// EventEmitter utility (for plugin authors)
export { EventEmitter } from './utils/index.js';
