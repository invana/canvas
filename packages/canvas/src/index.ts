// @invana/canvas — public API surface
//
// Architecture: see `architecture-proposal.md` (long-term vision),
// `primitives-redesign-plan.md` (macro renderer redesign), and
// `primitives-v0-plan.md` (this v0 slice) at the repo root.

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
export type { CameraOptions } from './camera/Camera';

// ─── Context ────────────────────────────────────────────────────────────
export type { CanvasContext } from './context/CanvasContext';

// ─── Layers ─────────────────────────────────────────────────────────────
export { Layer } from './layers/Layer';
export type { ILayer, LayerOptions } from './layers/Layer';

export { WorldLayer } from './layers/WorldLayer';
export type { WorldLayerHit } from './layers/WorldLayer';

export { ScreenLayer } from './layers/ScreenLayer';
export type { ScreenLayerHit } from './layers/ScreenLayer';

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

// ─── Primitives (renderer + base classes + built-ins + types) ──────────
//
// The full primitives surface is also available via the `@invana/canvas/primitives`
// subpath export for finer-grained imports / tree-shaking.
export * from './primitives';

// ─── Infra services (used by primitives) ───────────────────────────────
export { TextureRegistry } from './textures/TextureRegistry';

// ─── Font helpers ─────────────────────────────────────────────────────
export { loadIconFont } from './fonts/loadIconFont';

// ─── Pixi re-export for paint callbacks ────────────────────────────────
//
// `Graphics` is re-exported so consumers writing `paint(g => ...)` style
// callbacks can type the parameter without a raw `pixi.js` import.
export type { Graphics } from 'pixi.js';
