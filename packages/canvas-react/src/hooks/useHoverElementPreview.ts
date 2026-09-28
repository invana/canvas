import { useEffect, useState } from 'react';
import type { Canvas } from '@invana/canvas';
import type { HoverElementPreviewBehaviour, PreviewSnapshot } from '@invana/graph';

import { useBehaviourInstance } from './useBehaviourInstance';

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
 * Follows the behaviour through {@link useBehaviourInstance}: it attaches when
 * the behaviour registers after this hook mounts (its wrapper is a sibling whose
 * effect runs later), clears when it unregisters, and re-attaches to a new
 * instance registered under the same id.
 */
export function useHoverElementPreview(
  options: UseHoverElementPreviewOptions = {},
  canvas?: Canvas | null,
): PreviewSnapshot | null {
  const { previewId = 'element-preview' } = options;
  const behaviour = useBehaviourInstance<HoverElementPreviewBehaviour>(previewId, canvas);
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(behaviour?.current ?? null);
    if (!behaviour) return;
    const offs = [
      behaviour.events.on('preview:show', setSnapshot),
      behaviour.events.on('preview:move', setSnapshot),
      behaviour.events.on('preview:hide', () => setSnapshot(null)),
    ];
    return () => offs.forEach((off) => off());
  }, [behaviour]);

  return snapshot;
}
