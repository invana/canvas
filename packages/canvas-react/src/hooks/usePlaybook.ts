import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { Canvas, CanvasConfig, Playbook, StepSpec } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** What {@link usePlaybook} returns — a render-time snapshot plus the moves. */
export interface UsePlaybookResult {
  /** The live `canvas.playbook` (for `toJSON`, `load`, `subscribe`). */
  playbook: Playbook<CanvasConfig>;
  /** The script's title. */
  title: string;
  /** The steps, in order. */
  steps: readonly StepSpec<CanvasConfig>[];
  /** The step the canvas is at, or `undefined` before the first. */
  current: StepSpec<CanvasConfig> | undefined;
  /** Index of {@link current}; `-1` before the first. */
  index: number;
  /** Whether there is a step after {@link current}. */
  canNext: boolean;
  /** Whether there is a step to go back from. */
  canPrevious: boolean;
  /** Play the next step (`playbook.next`). */
  next: () => Promise<void>;
  /** Revert the current step (`playbook.previous`). */
  previous: () => Promise<void>;
  /** Move to a step by id (`playbook.goTo`). */
  goTo: (stepId: string) => Promise<void>;
}

/**
 * The canvas's playbook — the script of JSON steps and the position in it —
 * as reactive React state (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`,
 * F16). Re-renders when a step is added, the script is loaded, or the position
 * moves. Headless: it draws nothing; a presenter bar or a step list is built
 * on it.
 *
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
export function usePlaybook(canvas?: Canvas | null): UsePlaybookResult {
  const resolved = useResolvedCanvas(canvas);
  const playbook = resolved.playbook;
  // `subscribe` fires on every change; a counter gives useSyncExternalStore a
  // snapshot that changes exactly then.
  const version = useRef(0);
  const subscribe = useCallback(
    (onChange: () => void) =>
      playbook.subscribe(() => {
        version.current++;
        onChange();
      }),
    [playbook],
  );
  const read = useCallback(() => version.current, []);
  const v = useSyncExternalStore(subscribe, read, read);

  return useMemo(
    () => ({
      playbook,
      title: playbook.title,
      steps: playbook.steps,
      current: playbook.current,
      index: playbook.index,
      canNext: playbook.index + 1 < playbook.steps.length,
      canPrevious: playbook.index >= 0,
      next: () => playbook.next(),
      previous: () => playbook.previous(),
      goTo: (stepId: string) => playbook.goTo(stepId),
    }),
    // `v` is the change signal; the playbook object itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playbook, v],
  );
}
