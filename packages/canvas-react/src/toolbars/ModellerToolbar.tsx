import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useTool } from '../hooks/useTool';
import { useHistory } from '../hooks/useHistory';
import { useClipboard } from '../hooks/useClipboard';
import { useClearGraph } from '../hooks/useClearGraph';
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
  /** Eraser icon for the selection-aware erase button. */
  clear: ToolbarIcon;
}

export interface ModellerToolbarProps {
  icons: ModellerToolbarIconSet;
  /** Which tool toggles to show, in order. Default `['select','add','connect','delete']`. */
  tools?: readonly GraphTool[];
  /** Override the tool tooltips / accessible labels. */
  labels?: Partial<Record<GraphTool, string>>;
  /**
   * Node-kind options for the **Add** tool's shape picker (key → label). The
   * picker shows only while the Add tool is active.
   */
  nodeKinds?: Record<string, string>;
  /** Per-kind icons for the shape picker. */
  nodeKindIcons?: Record<string, ToolbarIcon>;
  /** Show undo / redo (needs `icons.undo` + `icons.redo`). Default `true`. */
  showHistory?: boolean;
  /** Show the erase button. Default `true`. */
  showClear?: boolean;
  /** Layer the erase / history actions target. Default `'graph'`. */
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
 * / Delete) plus an optional Add-tool shape picker, undo/redo, and erase, with
 * dividers between groups. Tool state self-wires through {@link useTool}
 * (requires a `<GraphToolProvider>` ancestor); undo/redo/erase through their own
 * hooks (a `<GraphHistoryProvider>` makes them live). The consumer still
 * declares the drawing behaviours, gating each on the active tool.
 */
export function ModellerToolbar({
  icons,
  tools = DEFAULT_TOOLS,
  labels,
  nodeKinds,
  nodeKindIcons,
  showHistory = true,
  showClear = true,
  layerId = 'graph',
  position = 'top-center',
  orientation = 'horizontal',
  bare = false,
  canvas,
  className,
}: ModellerToolbarProps) {
  const { tool, setTool, nodeKind, setNodeKind } = useTool();
  const { undo, redo, canUndo, canRedo } = useHistory({ layerId }, canvas);
  const { remove, hasSelection } = useClipboard({}, canvas);
  const { clear } = useClearGraph(layerId, canvas);

  const toolItems: ToolbarItem[] = tools.map((t) => ({
    type: 'toggle',
    key: t,
    icon: icons[t],
    label: labels?.[t] ?? DEFAULT_LABELS[t],
    active: tool === t,
    onToggle: () => setTool(t),
  }));
  if (tool === 'add' && nodeKinds && Object.keys(nodeKinds).length > 0) {
    toolItems.push({
      type: 'select',
      key: 'node-kind',
      label: 'Shape',
      value: nodeKind,
      options: nodeKinds,
      icons: nodeKindIcons,
      onChange: setNodeKind,
    });
  }

  const groups: ToolbarItem[][] = [toolItems];
  if (showHistory && icons.undo && icons.redo) {
    groups.push([
      { type: 'button', key: 'undo', icon: icons.undo, label: 'Undo', onClick: undo, disabled: !canUndo },
      { type: 'button', key: 'redo', icon: icons.redo, label: 'Redo', onClick: redo, disabled: !canRedo },
    ]);
  }
  if (showClear) {
    groups.push([
      {
        type: 'button',
        key: 'erase',
        icon: icons.clear,
        label: hasSelection ? 'Erase selection' : 'Clear canvas',
        ...(hasSelection ? { text: 'Selection' } : {}),
        onClick: hasSelection ? remove : () => clear(),
      },
    ]);
  }

  // Join non-empty groups with dividers.
  const items: ToolbarItem[] = [];
  for (const group of groups) {
    if (group.length === 0) continue;
    if (items.length > 0) items.push({ type: 'divider', key: `sep-${items.length}` });
    items.push(...group);
  }

  const nav = <ToolbarItems items={items} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
