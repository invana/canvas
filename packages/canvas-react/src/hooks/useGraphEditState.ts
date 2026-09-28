import { useCallback, useContext, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphClipboard, GraphEditAccess } from '@invana/graph';

import { ClipboardContext } from '../ClipboardContext';
import { useResolvedCanvas } from './useResolvedCanvas';

/** A canvas that owns per-layer edit state — `GraphCanvas`, structurally. */
interface EditStateOwner {
  clipboard(layerId?: string): GraphClipboard | null;
}

/**
 * `canvas` as an {@link EditStateOwner} when it is one (a `GraphCanvas`), else
 * `null` (a plain `Canvas`). Structural, so a second copy of `@invana/graph` in
 * the module graph can't defeat it the way `instanceof` would.
 */
function editStateOwner(canvas: Canvas): EditStateOwner | null {
  const c = canvas as Partial<EditStateOwner>;
  return typeof c.clipboard === 'function' ? (c as EditStateOwner) : null;
}

/**
 * The edit access a provider registers its commands over: layer `layerId`
 * answers with the provider's own clipboard (read live, so a rebuilt instance
 * is seen), every other layer with the `GraphCanvas`'s own — `null` on a plain
 * `Canvas`. So a provider's override covers its layer and leaves the canvas's
 * behaviour for the rest. Internal to the providers.
 */
export function providerEditAccess(
  canvas: Canvas,
  layerId: string,
  own: () => GraphClipboard | null,
): GraphEditAccess {
  const owner = editStateOwner(canvas);
  return {
    clipboard: (id) => (id === layerId ? own() : (owner?.clipboard(id) ?? null)),
  };
}

/**
 * Re-read `read(owner)` whenever layers come or go — a `GraphCanvas` builds a
 * layer's edit state on `scene:layer:add` and drops it on remove (its own
 * listeners run first, so the read sees the new state).
 */
function useOwnedEditState<T>(canvas: Canvas | null, read: (owner: EditStateOwner) => T | null): T | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canvas) return () => {};
      const offs = [canvas.events.on('scene:layer:add', onChange), canvas.events.on('scene:layer:remove', onChange)];
      return () => {
        for (const off of offs) off();
      };
    },
    [canvas],
  );
  const get = useCallback(() => {
    const owner = canvas ? editStateOwner(canvas) : null;
    return owner ? read(owner) : null;
  }, [canvas, read]);
  return useSyncExternalStore(subscribe, get, get);
}

/** The `GraphClipboard` the `GraphCanvas` itself owns for graph layer `layerId`, or `null`. */
export function useCanvasGraphClipboard(canvas: Canvas | null, layerId = 'graph'): GraphClipboard | null {
  const read = useCallback((owner: EditStateOwner) => owner.clipboard(layerId), [layerId]);
  return useOwnedEditState(canvas, read);
}

/**
 * The `GraphClipboard`: a `<GraphClipboardProvider>` ancestor's, else the one
 * the `GraphCanvas` owns for `layerId` (default `'graph'`). `null` on a plain
 * `Canvas` with no provider.
 */
export function useGraphClipboard(layerId = 'graph', canvas?: Canvas | null): GraphClipboard | null {
  const fromProvider = useContext(ClipboardContext);
  const owned = useCanvasGraphClipboard(useResolvedCanvas(canvas), layerId);
  return fromProvider ?? owned;
}
