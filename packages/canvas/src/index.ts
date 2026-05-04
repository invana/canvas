// @invana/canvas — public API surface
//
// Architecture: see `architecture-proposal.md` at repo root.
// Concepts: Layer / Behaviour / Layout / Renderer.
//
// This file currently exports only the kernel primitives that have landed.
// Additional surface (Layer base classes, ShapesRenderer, toolkit) lands
// in subsequent steps.

// ─── Events ─────────────────────────────────────────────────────────────
export { EventEmitter } from './events/EventEmitter';
export type { EventMap, EventHandler } from './events/EventEmitter';

export {
  makeCanvasEvent,
  makeEventType,
  isExcludedFromTap,
  DEFAULT_TAP_EXCLUDE,
} from './events/CanvasEvent';
export type {
  CanvasEvent,
  EventSource,
  EventSourceKind,
} from './events/CanvasEvent';

export { CanvasEventBus } from './events/CanvasEventBus';
export type {
  CanvasGlobalEvents,
  TapHandler,
  TapOptions,
  CanvasEventBusOptions,
} from './events/CanvasEventBus';

export { SourceEmitter } from './events/SourceEmitter';

export {
  assertSerialisableInDev,
  findSerialisationViolations,
} from './events/assertSerialisable';

// ─── State ──────────────────────────────────────────────────────────────
export { createLayerStore } from './state/Store';
export type { Store, StoreApi, CreateLayerStoreOptions } from './state/Store';

export { ColumnStore } from './state/ColumnStore';
export type {
  ColumnType,
  ColumnSchema,
  ColumnValue,
  ColumnArray,
  RowOf,
  ColumnStoreOptions,
} from './state/ColumnStore';

export { DirtyBatcher } from './state/DirtyBatcher';
export type { DirtySnapshot } from './state/DirtyBatcher';

// ─── Camera ─────────────────────────────────────────────────────────────
export { Camera } from './camera/Camera';
export type { CameraOptions, Point, Rect } from './camera/Camera';

// ─── Context ────────────────────────────────────────────────────────────
export type { CanvasContext } from './context/CanvasContext';

// ─── Layers ─────────────────────────────────────────────────────────────
export { Layer } from './layers/Layer';
export type { ILayer, LayerOptions } from './layers/Layer';

export { WorldLayer } from './layers/WorldLayer';
export type { WorldLayerHit } from './layers/WorldLayer';

export { ScreenLayer } from './layers/ScreenLayer';
export type { ScreenLayerHit } from './layers/ScreenLayer';

export { SubLayer } from './layers/SubLayer';

// ─── Behaviours ─────────────────────────────────────────────────────────
export { Behaviour } from './behaviours/Behaviour';
export type { IBehaviour, BehaviourOptions } from './behaviours/Behaviour';

export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export type { DragPanBehaviourOptions, DragModifier } from './behaviours/DragPanBehaviour';

export { WheelZoomBehaviour } from './behaviours/WheelZoomBehaviour';
export type { WheelZoomBehaviourOptions } from './behaviours/WheelZoomBehaviour';

export { PinchZoomBehaviour } from './behaviours/PinchZoomBehaviour';
export type { PinchZoomBehaviourOptions } from './behaviours/PinchZoomBehaviour';

export { KeyboardCameraInputBehaviour } from './behaviours/KeyboardCameraInputBehaviour';
export type {
  KeyboardCameraInputBehaviourOptions,
  KeyboardCameraKeymap,
} from './behaviours/KeyboardCameraInputBehaviour';

// ─── Layouts ────────────────────────────────────────────────────────────
export type { Layout } from './layouts/Layout';

// ─── Registries ─────────────────────────────────────────────────────────
export { LayerRegistry } from './registries/LayerRegistry';
export type { LayerRegistryOptions } from './registries/LayerRegistry';

export { BehaviourRegistry } from './registries/BehaviourRegistry';
export type { BehaviourRegistryOptions } from './registries/BehaviourRegistry';

// ─── Engine ─────────────────────────────────────────────────────────────
export { Canvas } from './engine/Canvas';
export type { CanvasOptions } from './engine/Canvas';

// ─── Draw module (low-level paint primitives) ──────────────────────────
// Pure-function paint API for shapes / connectors / text / routers /
// decorations. Single-responsibility per primitive — composition lives in
// layers, not here. Re-exported as a namespace to avoid name conflicts with
// the legacy renderer types.
export * as draw from './renderers/draw';

// Pixi `Graphics` type re-exported so consumers writing `paint(g => ...)`
// callbacks against PaintLayer can type the callback parameter without a
// raw `pixi.js` import.
export type { Graphics } from 'pixi.js';

// ─── Renderers ──────────────────────────────────────────────────────────
// Mirror of the `@invana/canvas/renderers/shapes` subpath export. The
// renderer ships under both the kernel barrel (for convenience) and the
// dedicated subpath (for tree-shaking / discoverability).
export { ShapesRenderer } from './renderers/ShapesRenderer';
export type { ShapesRendererOptions } from './renderers/ShapesRenderer';

export { TextureRegistry } from './renderers/TextureRegistry';
export type { ISpritePool } from './renderers/types';

export type {
  Point as ShapesPoint,
  Vec2,
  Rect as ShapesRect,
  Endpoint,
  BaseShapeSpec,
  BaseConnectorSpec,
  ConnectorEndpointSpec,
  IShape,
  IConnector,
  IMarker,
  IRouter,
  IShapeDecoration,
  IConnectorDecoration,
  IDecorationBase,
  ShapeHostInfo,
  ConnectorHostInfo,
  ShapeDecorationHostInfo,
  ConnectorDecorationHostInfo,
  ShapeCtor,
  ConnectorCtor,
  MarkerCtor,
  ShapeDecorationCtor,
  ConnectorDecorationCtor,
  DecorationTarget,
  RegisterDecorationOptions,
  DecorationSpec,
  HitResult,
  ShapesRendererEventMap,
  RenderStats,
} from './renderers/types';
