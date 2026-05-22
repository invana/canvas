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

// ─── Behaviours ──────────────────────────────────────────────────────────
export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export type { DragPanBehaviourProps } from './behaviours/DragPanBehaviour';

export { WheelZoomBehaviour } from './behaviours/WheelZoomBehaviour';
export type { WheelZoomBehaviourProps } from './behaviours/WheelZoomBehaviour';

export { DragNodeBehaviour } from './behaviours/DragNodeBehaviour';
export type { DragNodeBehaviourProps } from './behaviours/DragNodeBehaviour';

// ─── Layouts ─────────────────────────────────────────────────────────────
export { D3ForceLayout } from './layouts/D3ForceLayout';
export type { D3ForceLayoutProps } from './layouts/D3ForceLayout';
