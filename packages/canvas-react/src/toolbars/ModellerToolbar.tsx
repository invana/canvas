import { NavHorizontal, NavVertical } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import {
  Panel,
  ControlButton,
  OptionPicker,
  UndoButton,
  RedoButton,
  ClearButton,
} from '../components';
import type { PanelPosition, ToolbarIcon, TooltipSide } from '../components';
import { useTool } from '../hooks/useTool';
import type { GraphTool } from '../ToolContext';

/** Icons for the modeller toolbar. The four tool icons are required; the rest gate their controls. */
export interface ModellerToolbarIconSet {
  select: ToolbarIcon;
  add: ToolbarIcon;
  connect: ToolbarIcon;
  delete: ToolbarIcon;
  /** Required when `showHistory` is on (the default). */
  undo?: ToolbarIcon;
  redo?: ToolbarIcon;
  /** Optional leading icon for the Clear button. */
  clear?: ToolbarIcon;
}

export interface ModellerToolbarProps {
  icons: ModellerToolbarIconSet;
  /** Which tool toggles to show, in order. Default `['select','add','connect','delete']`. */
  tools?: readonly GraphTool[];
  /** Override the tool tooltips / accessible labels. */
  labels?: Partial<Record<GraphTool, string>>;
  /**
   * Node-kind options for the **Add** tool's shape picker (key → label). The
   * picker shows only while the Add tool is active. Omit / leave empty to hide
   * it (e.g. when your `createNode` factory is fixed-shape).
   */
  nodeKinds?: Record<string, string>;
  /** Per-kind icons for the shape picker. */
  nodeKindIcons?: Record<string, ToolbarIcon>;
  /** Show undo / redo (needs `icons.undo` + `icons.redo`). Default `true`. */
  showHistory?: boolean;
  /** Show the clear-canvas button. Default `true`. */
  showClear?: boolean;
  /** Layer the clear button targets. Default `'graph'`. */
  layerId?: string;
  /** Where the toolbar pins. Default `'top-center'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

const DEFAULT_TOOLS: readonly GraphTool[] = ['select', 'add', 'connect', 'delete'];
const DEFAULT_LABELS: Record<GraphTool, string> = {
  select: 'Select',
  add: 'Add node',
  connect: 'Connect',
  delete: 'Delete',
};

/**
 * Turnkey **drawing / modeller** toolbar — tool toggles (Select / Add / Connect
 * / Delete) plus an optional Add-tool shape picker, undo/redo, and clear. The
 * canvas equivalent of a drawing app's tool palette.
 *
 * Self-wires the tool toggles through {@link useTool} (requires a
 * `<GraphToolProvider>` ancestor) and the undo/redo/clear actions through their
 * own hooks (a `<GraphHistoryProvider>` makes them live). The consumer still
 * declares the drawing behaviours, gating each one's `enabled` on the active
 * tool — this toolbar owns the *tool state*, not the behaviours.
 */
export function ModellerToolbar({
  icons,
  tools = DEFAULT_TOOLS,
  labels,
  nodeKinds,
  nodeKindIcons,
  showHistory = true,
  showClear = true,
  layerId,
  position = 'top-center',
  orientation = 'horizontal',
  bare = false,
  canvas,
  className,
}: ModellerToolbarProps) {
  const { tool, setTool, nodeKind, setNodeKind } = useTool();
  const tipSide: TooltipSide = orientation === 'vertical' ? 'right' : 'bottom';
  const label = (t: GraphTool): string => labels?.[t] ?? DEFAULT_LABELS[t];

  const controls = (
    <>
      {tools.map((t) => (
        <ControlButton
          key={t}
          icon={icons[t]}
          title={label(t)}
          tooltipSide={tipSide}
          active={tool === t}
          onClick={() => setTool(t)}
        />
      ))}
      {tool === 'add' && nodeKinds && Object.keys(nodeKinds).length > 0 && (
        <OptionPicker
          label="Shape"
          value={nodeKind}
          options={nodeKinds}
          {...(nodeKindIcons ? { icons: nodeKindIcons } : {})}
          onChange={setNodeKind}
          tooltipSide={tipSide}
        />
      )}
      {showHistory && icons.undo && icons.redo && (
        <>
          <UndoButton icon={icons.undo} tooltipSide={tipSide} canvas={canvas} />
          <RedoButton icon={icons.redo} tooltipSide={tipSide} canvas={canvas} />
        </>
      )}
      {showClear && (
        <ClearButton icon={icons.clear} layerId={layerId} tooltipSide={tipSide} canvas={canvas} />
      )}
    </>
  );

  const nav =
    orientation === 'vertical' ? (
      <NavVertical top={controls} className={className} />
    ) : (
      <NavHorizontal left={controls} className={className} />
    );

  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
