import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ToolContext, type GraphTool, type ToolContextValue } from '../ToolContext';

export interface GraphToolProviderProps {
  /** Tool active on mount. Default `'select'`. */
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

/**
 * Holds the active modelling {@link GraphTool} + node kind and provides them via
 * {@link ToolContext}. The modeller equivalent of `<GraphHistoryProvider>`:
 * descendant `useTool` / `<ModellerToolbar>` read and switch the tool; the
 * consumer gates its drawing behaviours' `enabled` on `useTool().tool`.
 *
 * Place it anywhere above both the toolbar and the `<Canvas>` (it owns no engine
 * reference — it's pure React state), typically wrapping the whole modeller.
 */
export function GraphToolProvider({
  defaultTool = 'select',
  defaultNodeKind = 'circle',
  escapeToSelect = true,
  children,
}: GraphToolProviderProps) {
  const [tool, setTool] = useState<GraphTool>(defaultTool);
  const [nodeKind, setNodeKind] = useState<string>(defaultNodeKind);

  // Esc → back to the neutral Select tool (the draw behaviours' onDisable
  // cancels any in-flight gesture when their `enabled` flips off).
  const reset = useCallback(() => setTool('select'), []);
  useEffect(() => {
    if (!escapeToSelect) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [escapeToSelect, reset]);

  const value = useMemo<ToolContextValue>(
    () => ({ tool, setTool, nodeKind, setNodeKind }),
    [tool, nodeKind],
  );

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}
