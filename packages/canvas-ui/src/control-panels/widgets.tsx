import type { ComponentType } from 'react';
import type { Canvas } from '@invana/canvas';
import { useZoom } from '@invana/canvas-react';

import { DevInfoToggleButton, type DevInfoToggleButtonProps } from '../toolbars/DevInfoToggleButton';
import { ExportImageToolbar, type ExportImageToolbarProps } from '../toolbars/ExportImageToolbar';
import { ExportStateToolbar, type ExportStateToolbarProps } from '../toolbars/ExportStateToolbar';
import { MiniMapToggleButton, type MiniMapToggleButtonProps } from '../toolbars/MiniMapToggleButton';

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

// UI-rich controls (a hover-card form, a control that mounts its own layer) are
// widgets: the spec names them, their `options` are the component's props.

/** Export-as-image trigger + hover card. `options` → `ExportImageToolbarProps`. */
function ExportImageWidget({ canvas, options }: ControlWidgetProps) {
  return <ExportImageToolbar {...(options as ExportImageToolbarProps | undefined)} canvas={canvas} />;
}

/** Save / load state JSON trigger + hover card. `options` → `ExportStateToolbarProps`. */
function ExportStateWidget({ canvas, options }: ControlWidgetProps) {
  return <ExportStateToolbar {...(options as ExportStateToolbarProps | undefined)} canvas={canvas} />;
}

/** Minimap on/off (mounts the `MiniMapLayer`). `options` → `MiniMapToggleButtonProps`. */
function MiniMapToggleWidget({ canvas, options }: ControlWidgetProps) {
  return <MiniMapToggleButton {...(options as MiniMapToggleButtonProps | undefined)} canvas={canvas} />;
}

/** Dev-info overlay on/off. `options` → `DevInfoToggleButtonProps`. */
function DevInfoToggleWidget({ canvas, options }: ControlWidgetProps) {
  return <DevInfoToggleButton {...(options as DevInfoToggleButtonProps | undefined)} canvas={canvas} />;
}

/** The default **widget registry** for control panels. */
export const DEFAULT_CONTROL_WIDGETS: Readonly<Record<string, ControlWidget>> = {
  'zoom-readout': ZoomReadoutWidget,
  'export-image': ExportImageWidget,
  'export-state': ExportStateWidget,
  'minimap-toggle': MiniMapToggleWidget,
  'devinfo-toggle': DevInfoToggleWidget,
};
