import { useContext, useEffect, useRef } from 'react';
import type { Canvas, CommandOption } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';
import { ToolContext, type GraphTool, type ToolContextValue } from '../ToolContext';

/** Every modeller tool, in toolbar order, with its default label + icon name. */
const TOOL_OPTIONS: Record<GraphTool, CommandOption> = {
  select: { value: 'select', label: 'Select', icon: 'pointer' },
  add: { value: 'add', label: 'Add node', icon: 'plus' },
  connect: { value: 'connect', label: 'Connect', icon: 'spline' },
  delete: { value: 'delete', label: 'Delete', icon: 'eraser' },
};

/** Read a field off a JSON `args` bag, or `undefined`. */
function arg<T>(args: unknown, key: string): T | undefined {
  return args && typeof args === 'object' ? ((args as Record<string, unknown>)[key] as T | undefined) : undefined;
}

/** Register the `tool.*` commands on `canvas`, reading the provider through `ref` (always the latest value). */
function registerToolCommands(canvas: Canvas, ref: { current: ToolContextValue }): () => void {
  const offTool = canvas.commands.register('tool.active', {
    label: 'Tool',
    value: () => ref.current.tool,
    // `args.tools` narrows / reorders the offered tools.
    options: (_c, args) => {
      const tools = arg<GraphTool[]>(args, 'tools') ?? (Object.keys(TOOL_OPTIONS) as GraphTool[]);
      return tools.filter((t) => t in TOOL_OPTIONS).map((t) => TOOL_OPTIONS[t]);
    },
    run: (_c, args) => {
      const value = arg<string>(args, 'value');
      if (value && value in TOOL_OPTIONS) ref.current.setTool(value as GraphTool);
    },
  });
  const offKind = canvas.commands.register('tool.nodeKind', {
    label: 'Shape',
    value: () => ref.current.nodeKind,
    // `args.kinds` (key → label) lists the shapes; without it, only the current one.
    options: (_c, args) => {
      const kinds = arg<Record<string, string>>(args, 'kinds');
      return kinds
        ? Object.entries(kinds).map(([value, label]) => ({ value, label }))
        : [{ value: ref.current.nodeKind, label: ref.current.nodeKind }];
    },
    isEnabled: () => ref.current.tool === 'add',
    run: (_c, args) => {
      const value = arg<string>(args, 'value');
      if (value) ref.current.setNodeKind(value);
    },
  });
  return () => {
    offTool();
    offKind();
  };
}

/**
 * Bridges a `<GraphToolProvider>` above the canvas to the canvas's command
 * registry, so a saved control panel can switch the modeller tool:
 *
 * | Name | Kind | Value | Args |
 * |---|---|---|---|
 * | `tool.active` | choice | the active {@link GraphTool} | `{ tools?, value }` |
 * | `tool.nodeKind` | choice, enabled while the tool is `add` | the Add tool's node kind | `{ kinds?, value }` |
 *
 * Mounted by the `<GraphCanvas>` root for every graph canvas; a no-op when no
 * `ToolContext` is above it. Renders `null`.
 *
 * @internal
 */
export function ToolCommands() {
  const canvas = useCanvas();
  const tools = useContext(ToolContext);
  const ref = useRef(tools);
  ref.current = tools;
  const present = tools !== null;

  // Registered while a provider is present; the commands read `ref`, so a tool
  // switch needs only an `invalidate()`, not a re-registration.
  useEffect(() => {
    if (!present) return;
    return registerToolCommands(canvas, ref as { current: ToolContextValue });
  }, [canvas, present]);

  const tool = tools?.tool;
  const nodeKind = tools?.nodeKind;
  useEffect(() => {
    if (present) canvas.commands.invalidate();
  }, [canvas, present, tool, nodeKind]);

  return null;
}
