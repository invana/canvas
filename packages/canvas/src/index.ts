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

// ─── Lifecycle (Layer / Behaviour / Layout) ─────────────────────────────
export { Layer } from './lifecycle/Layer';
export type { ILayer, LayerOptions } from './lifecycle/Layer';

export { WorldLayer } from './lifecycle/WorldLayer';
export type { WorldLayerHit } from './lifecycle/WorldLayer';

export { ScreenLayer } from './lifecycle/ScreenLayer';
export type { ScreenLayerHit } from './lifecycle/ScreenLayer';

export { SubLayer } from './lifecycle/SubLayer';

export { Behaviour } from './lifecycle/Behaviour';
export type { IBehaviour, BehaviourOptions } from './lifecycle/Behaviour';

export type { Layout } from './lifecycle/Layout';

// ─── Registries ─────────────────────────────────────────────────────────
export { LayerRegistry } from './registries/LayerRegistry';
export type { LayerRegistryOptions } from './registries/LayerRegistry';

export { BehaviourRegistry } from './registries/BehaviourRegistry';
export type { BehaviourRegistryOptions } from './registries/BehaviourRegistry';

// ─── Engine ─────────────────────────────────────────────────────────────
export { Canvas } from './engine/Canvas';
export type { CanvasOptions } from './engine/Canvas';

// ─── Toolkit (built-in behaviours / layers) ─────────────────────────────
export {
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from './toolkit/index';
export type {
  DragPanBehaviourOptions,
  DragModifier,
  WheelZoomBehaviourOptions,
  PinchZoomBehaviourOptions,
  KeyboardCameraInputBehaviourOptions,
  KeyboardCameraKeymap,
} from './toolkit/index';

// ─── Renderers ──────────────────────────────────────────────────────────
// Mirror of the `@invana/canvas/renderers/shapes` subpath export. The
// renderer ships under both the kernel barrel (for convenience) and the
// dedicated subpath (for tree-shaking / discoverability).
export { ShapesRenderer } from './renderers/ShapesRenderer';
export type { ShapesRendererOptions } from './renderers/ShapesRenderer';
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
