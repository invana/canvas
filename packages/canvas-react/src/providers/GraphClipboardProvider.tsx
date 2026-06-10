import { useEffect, useState, type ReactNode } from 'react';
import {
  GraphClipboard,
  type GraphLayer,
  type Vec2,
} from '@invana/graph';
import type { Canvas } from '@invana/canvas';

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
 * Constructs a `GraphClipboard` over the target layer's store and provides it
 * via {@link ClipboardContext}. Place it **inside** `<Canvas>` and **after** the
 * `<GraphLayer>` it targets. Descendant `useClipboard` / Cut-Copy-Paste-Delete
 * buttons resolve the clipboard from here. Pair with a `<GraphHistoryProvider>`
 * to make cut/paste/delete undoable.
 */
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

  return <ClipboardContext.Provider value={clipboard}>{children}</ClipboardContext.Provider>;
}
