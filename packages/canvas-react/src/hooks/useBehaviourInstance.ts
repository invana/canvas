import { useCallback, useSyncExternalStore } from 'react';
import type { Canvas, IBehaviour } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * The behaviour instance currently registered under `id`, or `null` — kept live
 * across registration changes.
 *
 * Re-reads on `scene:behaviour:register` **and** `scene:behaviour:unregister`
 * for that id, so a caller sees the behaviour appear late (its wrapper's effect
 * ran after the caller's), disappear, and come back as a *new* instance
 * (a wrapper remount, a key change, StrictMode's double mount). Subscribe to the
 * instance's own events in an effect keyed on the returned value: the effect
 * then drops the old instance's listeners and attaches to the new one.
 *
 * @param id The behaviour id, as registered.
 * @param canvas Explicit engine; defaults to the enclosing `<Canvas>`.
 */
export function useBehaviourInstance<T extends IBehaviour = IBehaviour>(
  id: string,
  canvas?: Canvas | null,
): T | null {
  const resolved = useResolvedCanvas(canvas);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const onScene = (e: { id: string }): void => {
        if (e.id === id) onChange();
      };
      const offs = [
        resolved.events.on('scene:behaviour:register', onScene),
        resolved.events.on('scene:behaviour:unregister', onScene),
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved, id],
  );
  const read = useCallback(() => resolved.behaviours.get<T>(id) ?? null, [resolved, id]);
  return useSyncExternalStore(subscribe, read, read);
}
