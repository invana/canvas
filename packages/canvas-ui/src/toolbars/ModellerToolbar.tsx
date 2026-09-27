import { useMemo } from 'react';
import type { Canvas, ControlItemSpec } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useTool } from '@invana/canvas-react';
import type { GraphTool } from '@invana/canvas-react';
import { useControlItems } from '../control-panels/ControlItems';
import { eraseSpec, historySpecs, joinGroups } from './controlSpecs';

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
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
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
/** Icon-registry names for the four drawing tools. */
const TOOL_ICONS: Record<GraphTool, string> = {
  select: 'pointer',
  add: 'plus',
  connect: 'spline',
  delete: 'eraser',
};

/**
 * Turnkey **drawing / modeller** toolbar — tool toggles (Select / Add / Connect
 * / Delete) plus an optional Add-tool shape picker, undo/redo, and erase, with
 * dividers between groups. Tool state self-wires through {@link useTool} — the
 * canvas store's `interaction.viewMode`, reached through a `<GraphToolProvider>`
 * or the enclosing canvas root. Every control is a control spec (`tool.active`
 * per tool, `tool.nodeKind`, `history.*`, `graph.erase`) drawn like a saved
 * panel's (a `<GraphHistoryProvider>` makes undo/redo live). The consumer still
 * declares the drawing behaviours — give each `modes` (e.g. `modes: ['connect']`)
 * and they follow the tool on their own. Only the per-kind shape-picker icons
 * (`nodeKindIcons`) are consumer-supplied, since those are domain-specific.
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
  orientation = 'horizontal',
  canvas,
  className,
}: ModellerToolbarProps) {
  const { tool } = useTool();

  // The node-kind icons are the consumer's components: register them under
  // private names so the kind options can point at them.
  const kindIcons = useMemo(
    () => (nodeKindIcons ? Object.fromEntries(Object.entries(nodeKindIcons).map(([k, Icon]) => [`kind:${k}`, Icon])) : undefined),
    [nodeKindIcons],
  );

  const toolSpecs: ControlItemSpec[] = tools.map((t) => ({
    type: 'toggle',
    key: t,
    command: 'tool.active',
    args: { value: t },
    icon: TOOL_ICONS[t],
    label: labels?.[t] ?? DEFAULT_LABELS[t],
  }));
  // The shape picker shows only while the Add tool is active.
  if (tool === 'add' && nodeKinds && Object.keys(nodeKinds).length > 0) {
    toolSpecs.push({
      type: 'choice',
      key: 'node-kind',
      command: 'tool.nodeKind',
      label: 'Shape',
      options: Object.entries(nodeKinds).map(([value, label]) => ({
        value,
        label,
        ...(nodeKindIcons?.[value] ? { icon: `kind:${value}` } : {}),
      })),
    });
  }

  const specs = joinGroups([
    toolSpecs,
    showHistory ? historySpecs() : [],
    showClear ? [eraseSpec({ icon: 'trash', layerId })] : [],
  ]);
  const items = useControlItems(specs, { canvas, ...(kindIcons ? { icons: kindIcons } : {}) })
    // The picker keeps its "Shape: Circle" trigger (the spec renderer drops the value when options carry icons).
    .map((it) => (it.key === 'node-kind' && it.type === 'select' ? { ...it, triggerLabelOnly: false } : it));

  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
