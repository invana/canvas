import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Canvas } from '@invana/canvas';

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
}

/**
 * Live {@link CommandState} for each ref, plus a `run` dispatcher — what a
 * control-panel renderer needs to draw command buttons and toggles.
 *
 * Re-evaluates on view-store changes, command (un)registration and behaviour
 * enable / disable, but **re-renders only when a state actually flips**: the
 * snapshot is a compact string of the states, so pointer-rate view writes
 * (hover, camera) that change nothing here cost one comparison.
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

  const getSnapshot = (): string =>
    refs
      .map(({ command, args }) => {
        const c = resolved.commands;
        return `${c.has(command) ? 1 : 0}${c.isEnabled(command, args) ? 1 : 0}${c.isActive(command, args) ? 1 : 0}`;
      })
      .join('|');

  const key = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const states = useMemo<CommandState[]>(
    () =>
      key === ''
        ? []
        : key.split('|').map((s) => ({ available: s[0] === '1', enabled: s[1] === '1', active: s[2] === '1' })),
    [key],
  );
  const run = useCallback((command: string, args?: unknown) => resolved.commands.run(command, args), [resolved]);

  return { states, run };
}
