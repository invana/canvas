import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Canvas, CommandOption } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** A command by name plus the args a spec passes it. */
export interface CommandRef {
  command: string;
  args?: unknown;
}

/** The live state of one {@link CommandRef}. */
export interface CommandState {
  /** The command is registered. */
  available: boolean;
  /** Registered and its `isEnabled` allows running now. */
  enabled: boolean;
  /** Its `isActive` (toggle state). */
  active: boolean;
  /** Its `value` (pick-one commands), or `null`. */
  value: string | null;
  /** Its `options` (pick-one commands), or `[]`. */
  options: CommandOption[];
}

/**
 * Live {@link CommandState} for each ref, plus a `run` dispatcher — what a
 * control-panel renderer needs to draw command buttons and toggles.
 *
 * Re-evaluates on view-store changes, command (un)registration /
 * `invalidate()` and behaviour enable / disable, but **re-renders only when a
 * state actually changes**: the snapshot is the states serialised to a string,
 * so pointer-rate view writes (hover, camera) that change nothing here cost one
 * comparison.
 */
export function useCommandStates(
  refs: readonly CommandRef[],
  canvas?: Canvas | null,
): { states: CommandState[]; run: (command: string, args?: unknown) => boolean } {
  const resolved = useResolvedCanvas(canvas);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const offs = [
        resolved.store.view.subscribe(onChange),
        resolved.commands.subscribe(onChange),
        resolved.events.on('scene:behaviour:enable', onChange),
        resolved.events.on('scene:behaviour:disable', onChange),
        resolved.events.on('scene:behaviour:register', onChange),
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved],
  );

  const getSnapshot = (): string => {
    const c = resolved.commands;
    return JSON.stringify(
      refs.map(({ command, args }): CommandState => ({
        available: c.has(command),
        enabled: c.isEnabled(command, args),
        active: c.isActive(command, args),
        value: c.value(command, args),
        options: c.options(command, args),
      })),
    );
  };

  const key = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const states = useMemo(() => JSON.parse(key) as CommandState[], [key]);
  const run = useCallback((command: string, args?: unknown) => resolved.commands.run(command, args), [resolved]);

  return { states, run };
}
