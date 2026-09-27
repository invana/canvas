import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Canvas } from '@invana/canvas';

import { ToolBindingContext, ToolContext, type GraphTool, type ToolContextValue } from '../ToolContext';

export interface GraphToolProviderProps {
  /** Tool the canvas starts in. Default `'select'`. */
  defaultTool?: GraphTool;
  /** Node kind the Add tool drops first. Default `'circle'`. */
  defaultNodeKind?: string;
  /**
   * Pressing <kbd>Esc</kbd> returns to the `'select'` tool (cancelling any
   * in-progress draw). Default `true`. Set `false` to handle Esc yourself.
   */
  escapeToSelect?: boolean;
  children?: ReactNode;
}

/** The mode + node kind a store currently holds. */
function readTool(canvas: Canvas): { tool: GraphTool; nodeKind: string | undefined } {
  const { viewMode, viewModeArgs } = canvas.store.view.getState().interaction;
  return { tool: viewMode as GraphTool, nodeKind: viewModeArgs.nodeKind };
}

/**
 * Configures the modeller tool for the `<GraphCanvas>` below it and surfaces it
 * via {@link ToolContext} to anything in between — `useTool`, `<ModellerToolbar>`,
 * or the component that renders the canvas.
 *
 * The tool itself lives in the canvas store (`view.interaction.viewMode`, with
 * the node kind in `viewModeArgs.nodeKind`), so a saved control panel's
 * `tool.active` / `tool.nodeKind` commands and this provider always agree, and
 * behaviours declared with `modes` switch themselves. When a `<GraphCanvas>`
 * mounts below, the provider writes its current tool into that canvas's store
 * and mirrors the store from then on; until one mounts it holds the values
 * locally. One canvas per provider — a second binding takes over.
 *
 * Place it anywhere above both the toolbar and the canvas, typically wrapping
 * the whole modeller (e.g. `GraphCanvasApp`'s `wrap`).
 */
export function GraphToolProvider({
  defaultTool = 'select',
  defaultNodeKind = 'circle',
  escapeToSelect = true,
  children,
}: GraphToolProviderProps) {
  const [tool, setLocalTool] = useState<GraphTool>(defaultTool);
  const [nodeKind, setLocalNodeKind] = useState<string>(defaultNodeKind);
  const [bound, setBound] = useState<Canvas | null>(null);

  // The latest local values, read when a canvas binds (seeds its store).
  const latest = useRef({ tool, nodeKind });
  latest.current = { tool, nodeKind };

  const bind = useCallback((canvas: Canvas) => {
    const seed = latest.current;
    canvas.store.actions.viewMode.set(seed.tool, {
      ...canvas.store.view.getState().interaction.viewModeArgs,
      nodeKind: seed.nodeKind,
    });
    setBound(canvas);
    return () => setBound((cur) => (cur === canvas ? null : cur));
  }, []);

  // Mirror the bound store into local state, so consumers above the canvas
  // (which can't read its context) re-render on a mode switch from anywhere.
  useEffect(() => {
    if (!bound) return;
    const sync = (): void => {
      const next = readTool(bound);
      setLocalTool(next.tool);
      if (next.nodeKind !== undefined) setLocalNodeKind(next.nodeKind);
    };
    sync();
    return bound.store.view.subscribe((state, prev) => {
      if (
        state.interaction.viewMode !== prev.interaction.viewMode ||
        state.interaction.viewModeArgs !== prev.interaction.viewModeArgs
      ) {
        sync();
      }
    });
  }, [bound]);

  const setTool = useCallback(
    (next: GraphTool) => {
      if (bound) bound.store.actions.viewMode.set(next);
      else setLocalTool(next);
    },
    [bound],
  );
  const setNodeKind = useCallback(
    (next: string) => {
      if (bound) bound.store.actions.viewMode.setArgs({ nodeKind: next });
      else setLocalNodeKind(next);
    },
    [bound],
  );

  // Esc → back to the neutral Select tool (mode-gated draw behaviours' onDisable
  // cancels any in-flight gesture).
  useEffect(() => {
    if (!escapeToSelect) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setTool('select');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [escapeToSelect, setTool]);

  const value = useMemo<ToolContextValue>(
    () => ({ tool, setTool, nodeKind, setNodeKind }),
    [tool, setTool, nodeKind, setNodeKind],
  );

  return (
    <ToolBindingContext.Provider value={bind}>
      <ToolContext.Provider value={value}>{children}</ToolContext.Provider>
    </ToolBindingContext.Provider>
  );
}
