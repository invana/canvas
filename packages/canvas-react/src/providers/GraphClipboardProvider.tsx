import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  GraphClipboard,
  eraseCommand,
  type GraphLayer,
  type Vec2,
} from '@invana/graph';
import type { Canvas } from '@invana/canvas';

import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { ClipboardContext } from '../ClipboardContext';
import { HistoryContext } from '../HistoryContext';
import { pasteAndSelect, selectedElementIds } from './graphActions';

export interface GraphClipboardProviderProps {
  /** Id of the `GraphLayer` whose store the clipboard reads/writes. Default `'graph'`. */
  layerId?: string;
  /** Offset applied to pasted node positions. Forwarded to `GraphClipboard`. */
  pasteOffset?: Vec2;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  children?: ReactNode;
}

/**
 * Constructs a `GraphClipboard` over the target layer's store and provides it
 * via {@link ClipboardContext}. Place it **inside** `<Canvas>` and **after** the
 * `<GraphLayer>` it targets. Descendant `useClipboard` / Cut-Copy-Paste-Delete
 * buttons resolve the clipboard from here. Pair with a `<GraphHistoryProvider>`
 * to make cut/paste/delete undoable.
 *
 * While mounted it also registers the `clipboard.cut` / `.copy` / `.paste` /
 * `.delete` commands on the canvas, for control panels, and an undoable
 * `graph.erase` when a `<GraphHistoryProvider>` is above it.
 */
/** The click-select behaviour a clipboard command reads (`args.clickSelectId`, default `'click-select'`). */
function clickSelectIdOf(args: unknown): string {
  const id = args && typeof args === 'object' ? (args as { clickSelectId?: unknown }).clickSelectId : undefined;
  return typeof id === 'string' ? id : 'click-select';
}

export function GraphClipboardProvider({
  layerId = 'graph',
  pasteOffset,
  canvas,
  children,
}: GraphClipboardProviderProps) {
  const resolved = useResolvedCanvas(canvas);
  const [clipboard, setClipboard] = useState<GraphClipboard | null>(null);

  useEffect(() => {
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const store = layer?.store;
    if (!store) return;
    const instance = new GraphClipboard(store, pasteOffset ? { pasteOffset } : {});
    setClipboard(instance);
    return () => setClipboard(null);
  }, [resolved, layerId, pasteOffset]);

  // Undoable when a `<GraphHistoryProvider>` is an ancestor. Read through a ref
  // so the registered commands always see the current history.
  const history = useContext(HistoryContext);
  const historyRef = useRef(history);
  historyRef.current = history;

  // While mounted, cut / copy / paste / delete are canvas commands. They act on
  // the click-select behaviour's selection (`args.clickSelectId`, default
  // `'click-select'`); selection lives in the view store, so bound controls
  // follow it without extra wiring.
  useEffect(() => {
    if (!clipboard) return;
    const commands = resolved.commands;
    const selection = (args: unknown) => selectedElementIds(resolved, clickSelectIdOf(args));
    const hasSelection = (args: unknown) => {
      const { nodeIds, edgeIds } = selection(args);
      return nodeIds.length + edgeIds.length > 0;
    };
    const offs = [
      commands.register('clipboard.cut', {
        label: 'Cut',
        isEnabled: (_c, args) => hasSelection(args),
        run: (_c, args) => {
          const { nodeIds, edgeIds } = selection(args);
          clipboard.cut(nodeIds, edgeIds, historyRef.current ?? undefined);
        },
      }),
      commands.register('clipboard.copy', {
        label: 'Copy',
        isEnabled: (_c, args) => hasSelection(args),
        run: (_c, args) => {
          const { nodeIds, edgeIds } = selection(args);
          clipboard.copy(nodeIds, edgeIds);
        },
      }),
      commands.register('clipboard.paste', {
        label: 'Paste',
        isEnabled: () => clipboard.hasContent,
        run: (c, args) => pasteAndSelect(c, clipboard, historyRef.current, clickSelectIdOf(args)),
      }),
      commands.register('clipboard.delete', {
        label: 'Delete',
        isEnabled: (_c, args) => hasSelection(args),
        run: (_c, args) => {
          const { nodeIds, edgeIds } = selection(args);
          clipboard.delete(nodeIds, edgeIds, historyRef.current ?? undefined);
        },
      }),
      // Undoable, selection-aware erase (overrides the graph's plain one).
      commands.register('graph.erase', eraseCommand((target) => (target === layerId ? historyRef.current : null))),
      // The buffer isn't in the view store: tell bound controls it changed.
      clipboard.events.on('change', () => commands.invalidate()),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [clipboard, resolved, layerId]);

  return <ClipboardContext.Provider value={clipboard}>{children}</ClipboardContext.Provider>;
}
