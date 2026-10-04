import type { ComponentType } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, LocateFixed } from 'lucide-react';
import type { Canvas, CommandArgSpec } from '@invana/canvas';
import { useCommandStates, useZoom } from '@invana/canvas-react';

import { ToolbarItems, type ToolbarIcon } from '../components';
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
 *
 * A widget may describe its `options` bag with a static {@link ControlWidgetOptionsSpec}
 * — the same `CommandArgSpec` vocabulary a command's `args` use — so the Studio's
 * control-panel editor shows a field per described key instead of raw JSON.
 * Keys it doesn't describe (and every key of an undescribed widget) stay JSON.
 */
export type ControlWidget = ComponentType<ControlWidgetProps> & {
  /** Describes the widget's `options`, one entry per key. */
  optionsSpec?: ControlWidgetOptionsSpec;
};

/** A widget's option descriptor: `CommandArgSpec` per `options` key. */
export type ControlWidgetOptionsSpec = Readonly<Record<string, CommandArgSpec>>;

/**
 * Each widget's {@link ControlWidget.optionsSpec}, by name — what the control-panel
 * editor needs to turn widget options into fields. Undescribed widgets are left out.
 */
export function controlWidgetOptionsSpecs(
  widgets: Readonly<Record<string, ControlWidget>>,
): Readonly<Record<string, ControlWidgetOptionsSpec>> {
  const out: Record<string, ControlWidgetOptionsSpec> = {};
  for (const [name, widget] of Object.entries(widgets)) if (widget.optionsSpec) out[name] = widget.optionsSpec;
  return out;
}

/** Live zoom level, e.g. `125%`. */
function ZoomReadoutWidget({ canvas }: ControlWidgetProps) {
  const { zoom } = useZoom(canvas);
  return <span className="px-2 text-sm tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>;
}

/** Default `pan-pad` step, in screen px. */
const PAN_STEP = 80;

/** One pan-pad cell: its grid slot, glyph, label and `camera.pan` offset (the content moves by it). */
const PAN_CELLS: ReadonlyArray<{ key: string; slot: string; icon: ToolbarIcon; label: string; dx: number; dy: number }> = [
  { key: 'up', slot: 'col-start-2 row-start-1', icon: ArrowUp, label: 'Pan up', dx: 0, dy: 1 },
  { key: 'left', slot: 'col-start-1 row-start-2', icon: ArrowLeft, label: 'Pan left', dx: 1, dy: 0 },
  { key: 'right', slot: 'col-start-3 row-start-2', icon: ArrowRight, label: 'Pan right', dx: -1, dy: 0 },
  { key: 'down', slot: 'col-start-2 row-start-3', icon: ArrowDown, label: 'Pan down', dx: 0, dy: -1 },
];

/**
 * A 3×3 **pan pad**: arrows run `camera.pan` (one `options.step`, default 80 px,
 * per click) and the centre runs `camera.reset`.
 */
function PanPadWidget({ canvas, options }: ControlWidgetProps) {
  const step = typeof options?.step === 'number' ? options.step : PAN_STEP;
  const { states, run } = useCommandStates([{ command: 'camera.pan' }, { command: 'camera.reset' }], canvas);
  const panEnabled = states[0]?.enabled ?? false;
  return (
    <div className="grid grid-cols-3 grid-rows-3 place-items-center">
      {PAN_CELLS.map((c) => (
        <div key={c.key} className={c.slot}>
          <ToolbarItems
            items={[{
              type: 'button',
              key: c.key,
              icon: c.icon,
              label: c.label,
              disabled: !panEnabled,
              onClick: () => void run('camera.pan', { dx: c.dx * step, dy: c.dy * step }),
            }]}
          />
        </div>
      ))}
      <div className="col-start-2 row-start-2">
        <ToolbarItems
          items={[{
            type: 'button',
            key: 'reset',
            icon: LocateFixed,
            label: 'Reset view',
            disabled: !states[1]?.enabled,
            onClick: () => void run('camera.reset'),
          }]}
        />
      </div>
    </div>
  );
}
PanPadWidget.optionsSpec = {
  step: { kind: 'number', label: 'Step (px)', description: 'How far one arrow click pans.', default: PAN_STEP },
} satisfies ControlWidgetOptionsSpec;

// UI-rich controls (a hover-card form, a control that mounts its own layer) are
// widgets: the spec names them, their `options` are the component's props.

/** Export-as-image trigger + hover card. `options` → `ExportImageToolbarProps`. */
function ExportImageWidget({ canvas, options }: ControlWidgetProps) {
  return <ExportImageToolbar {...(options as ExportImageToolbarProps | undefined)} canvas={canvas} />;
}
// The JSON-able `ExportImageToolbarProps`; `defaultValue` (a settings object) stays JSON.
ExportImageWidget.optionsSpec = {
  formats: { kind: 'strings', label: 'Formats', description: 'Offered formats, in order: png, jpg, webp, svg.', default: ['png', 'jpg', 'webp', 'svg'] },
  filename: { kind: 'string', label: 'Filename', default: 'canvas' },
  label: { kind: 'string', label: 'Label', default: 'Export' },
  triggerText: { kind: 'string', label: 'Trigger text' },
  align: {
    kind: 'enum',
    label: 'Card alignment',
    default: 'end',
    options: [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
    ],
  },
  openDelay: { kind: 'number', label: 'Open delay (ms)', default: 120 },
  closeDelay: { kind: 'number', label: 'Close delay (ms)', default: 200 },
} satisfies ControlWidgetOptionsSpec;

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
  'pan-pad': PanPadWidget,
  'export-image': ExportImageWidget,
  'export-state': ExportStateWidget,
  'minimap-toggle': MiniMapToggleWidget,
  'devinfo-toggle': DevInfoToggleWidget,
};
