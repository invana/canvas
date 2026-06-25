import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { HoverElementPreviewBehaviour, PreviewSnapshot } from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseHoverElementPreviewOptions {
  /** Id of the `HoverElementPreviewBehaviour` to read previews from. Default `'element-preview'`. */
  previewId?: string;
}

/**
 * Reactive view of the **hover preview** currently surfaced by an
 * `HoverElementPreviewBehaviour` — the resolved card + its anchor — or `null` when
 * nothing is hovered (or the behaviour isn't registered yet).
 *
 * Subscribes to the behaviour's `preview:show` / `preview:move` / `preview:hide`
 * bus: `show` and `move` both publish the latest {@link PreviewSnapshot} (so the
 * card repositions as the camera pans / zooms), `hide` clears it. Pair with
 * {@link HoverElementPreviewCard} to draw it, or just use {@link HoverElementPreviewBehaviour}.
 *
 * Mirrors {@link useViewTarget}'s late-registration handling: if the behaviour
 * registers *after* this hook mounts (its wrapper is a sibling whose effect runs
 * later), it attaches as soon as `behaviour:registered` fires for `previewId`.
 */
export function useHoverElementPreview(
  options: UseHoverElementPreviewOptions = {},
  canvas?: Canvas | null,
): PreviewSnapshot | null {
  const { previewId = 'element-preview' } = options;
  const resolved = useResolvedCanvas(canvas);
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);

  useEffect(() => {
    const offs: Array<() => void> = [];
    const attach = (): boolean => {
      const behaviour = resolved.behaviours.get<HoverElementPreviewBehaviour>(previewId);
      if (!behaviour) return false;
      setSnapshot(behaviour.current);
      offs.push(behaviour.events.on('preview:show', setSnapshot));
      offs.push(behaviour.events.on('preview:move', setSnapshot));
      offs.push(behaviour.events.on('preview:hide', () => setSnapshot(null)));
      return true;
    };

    if (attach()) return () => offs.forEach((off) => off());

    setSnapshot(null);
    const offReg = resolved.events.on('behaviour:registered', ({ id }) => {
      if (id === previewId && attach()) offReg();
    });
    return () => {
      offReg();
      offs.forEach((off) => off());
    };
  }, [resolved, previewId]);

  return snapshot;
}
