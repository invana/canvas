import type { Canvas } from '@invana/canvas';
import { Eraser, MousePointer2, Plus, Redo2, Spline, Trash2, Undo2 } from 'lucide-react';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useTool } from '../hooks/useTool';
import { useHistory } from '../hooks/useHistory';
import { useClipboard } from '../hooks/useClipboard';
import { useClearGraph } from '../hooks/useClearGraph';
import type { GraphTool } from '../ToolContext';

export interface ModellerToolbarProps {
  /** Override the baked tool / undo / redo / erase icons, by item key. */
  icons?: Partial<Record<'select' | 'add' | 'connect' | 'delete' | 'undo' | 'redo' | 'erase', ToolbarIcon>>;
  /** Which tool toggles to show, in order. Default `['select','add','connect','delete']`. */
  tools?: readonly GraphTool[];
  /** Override the tool tooltips / accessible labels. */
  labels?: Partial<Record<GraphTool, string>>;
  /**
   * Node-kind options for the **Add** tool's shape picker (key → label). The
   * picker shows only while the Add tool is active.
   */
  nodeKinds?: Record<string, string>;
  /** Per-kind icons for the shape picker — domain-specific, so supplied by the consumer. */
  nodeKindIcons?: Record<string, ToolbarIcon>;
  /** Show undo / redo. Default `true`. */
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
  canvas?: Canvas | null;
  className?: string;
}

const DEFAULT_TOOLS: readonly GraphTool[] = ['select', 'add', 'connect', 'delete'];
const DEFAULT_LABELS: Record<GraphTool, string> = {
  select: 'Select',
  add: 'Add node',
  connect: 'Connect',
  delete: 'Delete',
};
/** Baked (lucide) icons for the four drawing tools. */
const TOOL_ICONS: Record<GraphTool, ToolbarIcon> = {
  select: MousePointer2,
  add: Plus,
  connect: Spline,
  delete: Eraser,
};

/**
 * Turnkey **drawing / modeller** toolbar — tool toggles (Select / Add / Connect
 * / Delete) plus an optional Add-tool shape picker, undo/redo, and erase, with
 * dividers between groups. Tool state self-wires through {@link useTool}
 * (requires a `<GraphToolProvider>` ancestor); undo/redo/erase through their own
 * hooks (a `<GraphHistoryProvider>` makes them live). The consumer still
 * declares the drawing behaviours, gating each on the active tool. The tool /
 * undo / redo / erase icons are baked in (lucide); only the per-kind shape-picker
 * icons (`nodeKindIcons`) are consumer-supplied, since those are domain-specific.
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
    icon: TOOL_ICONS[t],
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
  if (showHistory) {
    groups.push([
      { type: 'button', key: 'undo', icon: Undo2, label: 'Undo', onClick: undo, disabled: !canUndo },
      { type: 'button', key: 'redo', icon: Redo2, label: 'Redo', onClick: redo, disabled: !canRedo },
    ]);
  }
  if (showClear) {
    groups.push([
      {
        type: 'button',
        key: 'erase',
        icon: Trash2,
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

  const nav = (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
