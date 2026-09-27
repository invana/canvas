import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';

import { CanvasContext } from '../CanvasContext';
import { ToolContext, type GraphTool, type ToolContextValue } from '../ToolContext';

/** Node kind reported when neither the store nor a provider names one. */
const DEFAULT_NODE_KIND = 'circle';

/**
 * Read + switch the active modelling tool (and the Add tool's node kind).
 *
 * The tool is the canvas's interaction mode (`view.interaction.viewMode`), so
 * this works under a `<GraphToolProvider>` (anywhere — even above the canvas)
 * **or** anywhere inside a canvas root with no provider at all. Behaviours
 * declared with `modes` follow it by themselves:
 * `<CreateNodeBehaviour enabled modes={['add']} />`.
 *
 * @throws with neither a `<GraphToolProvider>` above nor a canvas root around it.
 */
export function useTool(): ToolContextValue {
  const provided = useContext(ToolContext);
  const canvas = useContext(CanvasContext);
  if (!provided && !canvas) {
    throw new Error('useTool must be used within a <GraphToolProvider> or a canvas root.');
  }
  // Hooks run unconditionally; with a provider the store read is unused.
  const fromStore = useStoreTool(provided ? null : canvas);
  return provided ?? fromStore!;
}

/** The tool straight from `canvas`'s store, or `null` without one. */
function useStoreTool(canvas: Canvas | null): ToolContextValue | null {
  const subscribe = useCallback(
    (onChange: () => void) =>
      canvas
        ? canvas.store.view.subscribe((state, prev) => {
            if (
              state.interaction.viewMode !== prev.interaction.viewMode ||
              state.interaction.viewModeArgs !== prev.interaction.viewModeArgs
            ) {
              onChange();
            }
          })
        : () => {},
    [canvas],
  );
  // Both slices are identity-stable between unrelated writes.
  const getMode = useCallback(() => (canvas ? canvas.store.view.getState().interaction.viewMode : null), [canvas]);
  const getArgs = useCallback(() => (canvas ? canvas.store.view.getState().interaction.viewModeArgs : null), [canvas]);
  const mode = useSyncExternalStore(subscribe, getMode, getMode);
  const args = useSyncExternalStore(subscribe, getArgs, getArgs);
  const setTool = useCallback((t: GraphTool) => canvas?.store.actions.viewMode.set(t), [canvas]);
  const setNodeKind = useCallback((k: string) => canvas?.store.actions.viewMode.setArgs({ nodeKind: k }), [canvas]);
  return useMemo(
    () =>
      canvas && mode !== null
        ? { tool: mode as GraphTool, setTool, nodeKind: args?.nodeKind ?? DEFAULT_NODE_KIND, setNodeKind }
        : null,
    [canvas, mode, args, setTool, setNodeKind],
  );
}
