import type { ComponentType } from 'react';
import type { Canvas } from '@invana/canvas';
import { useZoom } from '@invana/canvas-react';

/** Props every control-panel widget receives. */
export interface ControlWidgetProps {
  /** The canvas the panel sits on. */
  canvas: Canvas;
  /** The spec's `options` bag (JSON). */
  options?: Record<string, unknown>;
}

/**
 * A control-panel **widget**: live UI that a `{ type: 'widget', widget: name }`
 * item names. Register app widgets via `<ControlPanels widgets={…}>`.
 */
export type ControlWidget = ComponentType<ControlWidgetProps>;

/** Live zoom level, e.g. `125%`. */
function ZoomReadoutWidget({ canvas }: ControlWidgetProps) {
  const { zoom } = useZoom(canvas);
  return <span className="px-2 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>;
}

/** The default **widget registry** for control panels. */
export const DEFAULT_CONTROL_WIDGETS: Readonly<Record<string, ControlWidget>> = {
  'zoom-readout': ZoomReadoutWidget,
};
