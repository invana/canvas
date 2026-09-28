import { useEffect, useState, type ReactNode } from 'react';
import { GraphClipboard, registerGraphEditCommands, type GraphLayer, type Vec2 } from '@invana/graph';
import type { Canvas } from '@invana/canvas';

import { providerEditAccess, useCanvasGraphClipboard } from '../hooks/useGraphEditState';
import { useResolvedCanvas } from '../hooks/useResolvedCanvas';
import { ClipboardContext } from '../ClipboardContext';

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
 * with the `clipboard.*` commands registered, so this provider only **bridges**
 * that instance into the context and applies `pasteOffset` while mounted. It
 * registers nothing. Optional there: `useGraphClipboard` falls back to the
 * canvas's own.
 *
 * **Elsewhere** (a plain `Canvas`) it builds a `GraphClipboard` over the
 * layer's store and while mounted registers `clipboard.cut` / `.copy` /
 * `.paste` / `.delete` and a selection-aware `graph.erase`.
 *
 * Every edit is undoable either way: the layer's store records it into
 * `canvas.history`. Its commands are `@invana/graph`'s own
 * (`registerGraphEditCommands`) — the same args, bodies and palette metadata
 * as a `GraphCanvas`'s. They honour `args.layerId` (default: this provider's
 * `layerId`). Place it **after** the `<GraphLayer>` it targets.
 */
export function GraphClipboardProvider({
  layerId = 'graph',
  pasteOffset,
  canvas,
  children,
}: GraphClipboardProviderProps) {
  const resolved = useResolvedCanvas(canvas);
  // The `GraphCanvas`'s own clipboard for the layer, when it has one.
  const owned = useCanvasGraphClipboard(resolved, layerId);
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

  // Not bridging: while mounted, cut / copy / paste / delete and `graph.erase`
  // are canvas commands over this clipboard for `layerId` (the canvas's for
  // any other layer). They act on the click-select behaviour's selection
  // (`args.clickSelectId`); selection lives in the view store, so bound
  // controls follow it without extra wiring.
  useEffect(() => {
    if (!own) return;
    const commands = resolved.commands;
    const offs = [
      registerGraphEditCommands(commands, providerEditAccess(resolved, layerId, () => own), {
        layerId,
        only: ['clipboard.cut', 'clipboard.copy', 'clipboard.paste', 'clipboard.delete', 'graph.erase'],
      }),
      // The buffer isn't in the view store: tell bound controls it changed.
      own.events.on('change', () => commands.invalidate()),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [own, resolved, layerId]);

  return <ClipboardContext.Provider value={owned ?? own}>{children}</ClipboardContext.Provider>;
}
