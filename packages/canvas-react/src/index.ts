// @invana/canvas-react — public API surface
//
// Declarative React bindings for `@invana/canvas`. The package itself is a
// thin layer: `<Canvas>` owns the engine instance, child components register
// layers / behaviours / layouts via React context.
//
// See `CLAUDE.md` in this package for the wrapper-authoring pattern.

export { Canvas } from './Canvas';
export type { CanvasProps } from './Canvas';

export { CanvasContext, useCanvas } from './CanvasContext';

// ─── Layers ──────────────────────────────────────────────────────────────
export { GraphLayer } from './layers/GraphLayer';
export type { GraphLayerProps } from './layers/GraphLayer';

export { BackgroundLayer } from './layers/BackgroundLayer';
export type { BackgroundLayerProps } from './layers/BackgroundLayer';

export { MiniMapLayer } from './layers/MiniMapLayer';
export type { MiniMapLayerProps } from './layers/MiniMapLayer';

// ─── Behaviours ──────────────────────────────────────────────────────────
// Camera / canvas-scoped
export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export type { DragPanBehaviourProps } from './behaviours/DragPanBehaviour';

export { WheelZoomBehaviour } from './behaviours/WheelZoomBehaviour';
export type { WheelZoomBehaviourProps } from './behaviours/WheelZoomBehaviour';

export { PinchZoomBehaviour } from './behaviours/PinchZoomBehaviour';
export type { PinchZoomBehaviourProps } from './behaviours/PinchZoomBehaviour';

export { KeyboardCameraInputBehaviour } from './behaviours/KeyboardCameraInputBehaviour';
export type { KeyboardCameraInputBehaviourProps } from './behaviours/KeyboardCameraInputBehaviour';

// Graph-scoped
export { DragNodeBehaviour } from './behaviours/DragNodeBehaviour';
export type { DragNodeBehaviourProps } from './behaviours/DragNodeBehaviour';

export { ContextMenuBehaviour } from './behaviours/ContextMenuBehaviour';
export type { ContextMenuBehaviourProps } from './behaviours/ContextMenuBehaviour';

export { CreateNodeBehaviour } from './behaviours/CreateNodeBehaviour';
export type { CreateNodeBehaviourProps } from './behaviours/CreateNodeBehaviour';

export { DrawEdgeBehaviour } from './behaviours/DrawEdgeBehaviour';
export type { DrawEdgeBehaviourProps } from './behaviours/DrawEdgeBehaviour';

export { HoverActivateBehaviour } from './behaviours/HoverActivateBehaviour';
export type { HoverActivateBehaviourProps } from './behaviours/HoverActivateBehaviour';

export { ClickSelectBehaviour } from './behaviours/ClickSelectBehaviour';
export type { ClickSelectBehaviourProps } from './behaviours/ClickSelectBehaviour';

export { BrushSelectBehaviour } from './behaviours/BrushSelectBehaviour';
export type { BrushSelectBehaviourProps } from './behaviours/BrushSelectBehaviour';

export { LassoSelectBehaviour } from './behaviours/LassoSelectBehaviour';
export type { LassoSelectBehaviourProps } from './behaviours/LassoSelectBehaviour';

export { CollapseExpandBehaviour } from './behaviours/CollapseExpandBehaviour';
export type { CollapseExpandBehaviourProps } from './behaviours/CollapseExpandBehaviour';

export { NodeResizeBehaviour } from './behaviours/NodeResizeBehaviour';
export type { NodeResizeBehaviourProps } from './behaviours/NodeResizeBehaviour';

export { LabelCollisionBehaviour } from './behaviours/LabelCollisionBehaviour';
export type { LabelCollisionBehaviourProps } from './behaviours/LabelCollisionBehaviour';

export { LabelResolutionLODBehaviour } from './behaviours/LabelResolutionLODBehaviour';
export type { LabelResolutionLODBehaviourProps } from './behaviours/LabelResolutionLODBehaviour';

export { NodeSizeLODBehaviour } from './behaviours/NodeSizeLODBehaviour';
export type { NodeSizeLODBehaviourProps } from './behaviours/NodeSizeLODBehaviour';

export { EdgeSizeLODBehaviour } from './behaviours/EdgeSizeLODBehaviour';
export type { EdgeSizeLODBehaviourProps } from './behaviours/EdgeSizeLODBehaviour';

export { ParallelEdgeBehaviour } from './behaviours/ParallelEdgeBehaviour';
export type { ParallelEdgeBehaviourProps } from './behaviours/ParallelEdgeBehaviour';

export { DegreeSizeBehaviour } from './behaviours/DegreeSizeBehaviour';
export type { DegreeSizeBehaviourProps } from './behaviours/DegreeSizeBehaviour';

// ─── Layouts ─────────────────────────────────────────────────────────────
export { D3ForceLayout } from './layouts/D3ForceLayout';
export type { D3ForceLayoutProps } from './layouts/D3ForceLayout';

// ─── Hooks ───────────────────────────────────────────────────────────────
// Canvas-aware hooks for building custom toolbars / panels. Resolve the engine
// from CanvasContext (or an explicit instance) and subscribe to engine events.
export { useCamera, useZoom, useFitContent, useCanvasEvent, useClearGraph } from './hooks';
export type { UseCameraResult, UseZoomResult, UseFitContentResult, UseClearGraphResult } from './hooks';

// ─── Toolbars ──────────────────────────────────────────────────────────────
// `CanvasControlsToolbar` self-wires from context (React Flow's `<Controls>`);
// `GraphToolbar` is a turnkey layout/select/clear bar. Toolbar components carry
// the `*Toolbar` suffix.
export { CanvasControlsToolbar, GraphToolbar } from './toolbars';
export type {
  CanvasControlsToolbarProps,
  CanvasControlsToolbarIconSet,
  GraphToolbarProps,
} from './toolbars';

// ─── UI components (building blocks) ───────────────────────────────────────
// Dumb, engine-agnostic, icon-agnostic primitives the toolbars are built from —
// compose them into custom toolbars. `<Panel>` / `<ControlButton>` are the
// canvas equivalents of React Flow's `<Panel>` / `<ControlButton>`.
export {
  Panel,
  ControlButton,
  OptionPicker,
  ZoomControls,
  ZoomPicker,
  LockToggle,
  ClearButton,
  FitContentButton,
} from './components';
export type {
  PanelProps,
  PanelPosition,
  ControlButtonProps,
  OptionPickerProps,
  ZoomControlsProps,
  LockToggleProps,
  ClearButtonProps,
  FitContentButtonProps,
  ToolbarIcon,
} from './components';
