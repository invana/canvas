import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  GraphClipboard,
  copySelection,
  cutSelection,
  deleteSelection,
  eraseCommand,
  pasteAndSelect,
  selectedElementIds,
  type GraphLayer,
  type Vec2,
} from '@invana/graph';
import type { Canvas, CommandArgSpec } from '@invana/canvas';

import { useCanvasGraphClipboard, useCanvasGraphHistory } from '../hooks/useGraphEditState';
import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { ClipboardContext } from '../ClipboardContext';
import { HistoryContext } from '../HistoryContext';

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
 * Provides the target layer's `GraphClipboard` via {@link ClipboardContext},
 * for descendant `useClipboard` / Cut-Copy-Paste-Delete buttons.
 *
 * **On a `GraphCanvas`** the canvas already owns a clipboard per graph layer,
 * with the `clipboard.*` commands registered (undoable on the canvas's own
 * history), so this provider only **bridges** that instance into the context
 * and applies `pasteOffset` while mounted. It registers nothing — unless a
 * `<GraphHistoryProvider>` above it built its own history (the canvas has none:
 * `history: false`), in which case it registers the commands over that history
 * as below. Optional there: `useGraphClipboard` falls back to the canvas's own.
 *
 * **Elsewhere** (a plain `Canvas`) it keeps the original behaviour: it builds a
 * `GraphClipboard` over the layer's store and while mounted registers
 * `clipboard.cut` / `.copy` / `.paste` / `.delete` and a selection-aware
 * `graph.erase`, undoable when a `<GraphHistoryProvider>` is above it. The
 * command bodies are `@invana/graph`'s `copySelection` / `cutSelection` /
 * `deleteSelection` / `pasteAndSelect` — the same functions `useClipboard`
 * calls. Place it **after** the `<GraphLayer>` it targets.
 */
/** The click-select behaviour a clipboard command reads (`args.clickSelectId`, default `'click-select'`). */
function clickSelectIdOf(args: unknown): string {
  const id = args && typeof args === 'object' ? (args as { clickSelectId?: unknown }).clickSelectId : undefined;
  return typeof id === 'string' ? id : 'click-select';
}

/** `clipboard.*` args, described for the Studio's control-panel editor. */
const SELECTION_ARGS: Readonly<Record<string, CommandArgSpec>> = {
  clickSelectId: { kind: 'behaviour', label: 'Selection', default: 'click-select', description: 'The click-select behaviour to read' },
};

export function GraphClipboardProvider({
  layerId = 'graph',
  pasteOffset,
  canvas,
  children,
}: GraphClipboardProviderProps) {
  const resolved = useResolvedCanvas(canvas);
  // The `GraphCanvas`'s own clipboard / history for the layer, when it has them.
  const owned = useCanvasGraphClipboard(resolved, layerId);
  const ownedHistory = useCanvasGraphHistory(resolved, layerId);
  const [own, setOwn] = useState<GraphClipboard | null>(null);
  const offsetX = pasteOffset?.x;
  const offsetY = pasteOffset?.y;

  // Bridging: apply `pasteOffset` to the canvas's clipboard while mounted.
  useEffect(() => {
    if (!owned || offsetX === undefined || offsetY === undefined) return;
    const prev = owned.offset;
    owned.setPasteOffset({ x: offsetX, y: offsetY });
    return () => owned.setPasteOffset(prev);
  }, [owned, offsetX, offsetY]);

  // Not bridging: build one.
  useEffect(() => {
    if (owned) return;
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const store = layer?.store;
    if (!store) return;
    const offset = offsetX !== undefined && offsetY !== undefined ? { x: offsetX, y: offsetY } : undefined;
    const instance = new GraphClipboard(store, offset ? { pasteOffset: offset } : {});
    setOwn(instance);
    return () => setOwn(null);
  }, [resolved, layerId, offsetX, offsetY, owned]);

  // Undoable when a `<GraphHistoryProvider>` is an ancestor. Read through a ref
  // so the registered commands always see the current history.
  const history = useContext(HistoryContext);
  const historyRef = useRef(history);
  historyRef.current = history;

  // The canvas's built-in `clipboard.*` already cover its own clipboard + history.
  // Register ours only when not bridging, or when an ancestor's history isn't the
  // canvas's (the canvas was built with `history: false`).
  const clipboard = owned !== null && history !== null && history !== ownedHistory ? owned : own;

  // While mounted, cut / copy / paste / delete are canvas commands. They act on
  // the click-select behaviour's selection (`args.clickSelectId`, default
  // `'click-select'`); selection lives in the view store, so bound controls
  // follow it without extra wiring.
  useEffect(() => {
    if (!clipboard) return;
    const commands = resolved.commands;
    const hasSelection = (args: unknown) => {
      const { nodeIds, edgeIds } = selectedElementIds(resolved, clickSelectIdOf(args));
      return nodeIds.length + edgeIds.length > 0;
    };
    const offs = [
      commands.register('clipboard.cut', {
        args: SELECTION_ARGS,
        label: 'Cut',
        isEnabled: (_c, args) => hasSelection(args),
        run: (c, args) => cutSelection(c, clipboard, historyRef.current, clickSelectIdOf(args)),
      }),
      commands.register('clipboard.copy', {
        args: SELECTION_ARGS,
        label: 'Copy',
        isEnabled: (_c, args) => hasSelection(args),
        run: (c, args) => copySelection(c, clipboard, clickSelectIdOf(args)),
      }),
      commands.register('clipboard.paste', {
        args: SELECTION_ARGS,
        label: 'Paste',
        isEnabled: () => clipboard.hasContent,
        run: (c, args) => pasteAndSelect(c, clipboard, historyRef.current, clickSelectIdOf(args)),
      }),
      commands.register('clipboard.delete', {
        args: SELECTION_ARGS,
        label: 'Delete',
        isEnabled: (_c, args) => hasSelection(args),
        run: (c, args) => deleteSelection(c, clipboard, historyRef.current, clickSelectIdOf(args)),
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

  return <ClipboardContext.Provider value={owned ?? own}>{children}</ClipboardContext.Provider>;
}
