import { createContext } from 'react';
import type { Canvas } from '@invana/canvas';

/**
 * The active modelling tool. `'select'` is the neutral pointer (drag / select);
 * `'add'` drops nodes; `'connect'` draws edges; `'delete'` erases on click.
 * A string-literal union, but consumers may treat it opaquely — the
 * {@link ModellerToolbar} only renders the tools it's told to.
 */
export type GraphTool = 'select' | 'add' | 'connect' | 'delete';

/**
 * Shared modeller state surfaced by {@link GraphToolProvider} and `useTool`.
 * Backed by the canvas store (`view.interaction.viewMode` + `viewModeArgs.nodeKind`)
 * whenever a canvas is reachable; a provider with no canvas below it yet holds
 * the values locally until one mounts.
 */
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
 * The tool value a `<GraphToolProvider>` exposes to `useTool` / `<ModellerToolbar>`.
 * `null` when no provider is present — `useTool` then reads the enclosing
 * canvas's store directly.
 */
export const ToolContext = createContext<ToolContextValue | null>(null);

/**
 * Lets a `<GraphCanvas>` below a `<GraphToolProvider>` hand the provider its
 * canvas, so the provider can apply its defaults to that canvas's store and
 * mirror the store's mode from then on. Returns the release function.
 *
 * @internal
 */
export const ToolBindingContext = createContext<((canvas: Canvas) => () => void) | null>(null);
