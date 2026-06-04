import { useContext } from 'react';

import { ToolContext, type ToolContextValue } from '../ToolContext';

/**
 * Read + switch the active modelling tool (and Add-tool node kind) from a
 * `<GraphToolProvider>` ancestor.
 *
 * Gate your drawing behaviours on the result, e.g.
 * `<CreateNodeBehaviour enabled={useTool().tool === 'add'} />`.
 *
 * @throws if no `<GraphToolProvider>` is above — a modeller without one is a
 * wiring bug, so this fails loudly rather than silently doing nothing.
 */
export function useTool(): ToolContextValue {
  const ctx = useContext(ToolContext);
  if (!ctx) {
    throw new Error('useTool must be used within a <GraphToolProvider>.');
  }
  return ctx;
}
