import { createContext } from 'react';

/**
 * The active modelling tool. `'select'` is the neutral pointer (drag / select);
 * `'add'` drops nodes; `'connect'` draws edges; `'delete'` erases on click.
 * A string-literal union, but consumers may treat it opaquely — the
 * {@link ModellerToolbar} only renders the tools it's told to.
 */
export type GraphTool = 'select' | 'add' | 'connect' | 'delete';

/** Shared modeller state surfaced by {@link GraphToolProvider}. */
export interface ToolContextValue {
  /** The currently active tool. */
  tool: GraphTool;
  /** Switch the active tool. */
  setTool: (tool: GraphTool) => void;
  /**
   * The node "kind" the **Add** tool drops next (an opaque key like `'circle'`
   * / `'rect'`). The consumer maps it to a concrete `NodeStyle` in its
   * `CreateNodeBehaviour` `createNode` factory.
   */
  nodeKind: string;
  /** Choose the node kind the Add tool drops next. */
  setNodeKind: (kind: string) => void;
}

/**
 * Holds the active {@link GraphTool} + node kind for a modeller, set by a
 * `<GraphToolProvider>` and read by `useTool` / `<ModellerToolbar>`. `null` when
 * no provider is present — `useTool` throws in that case (a modeller toolbar
 * without a provider is a wiring bug, not a graceful-degrade case).
 */
export const ToolContext = createContext<ToolContextValue | null>(null);
