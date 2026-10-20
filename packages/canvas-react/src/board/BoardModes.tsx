import { useEffect, useRef, useState } from 'react';
import type { Canvas, CommandOption } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';
import { useCommandStates } from '../hooks/useCommandStates';
import { useResolvedCanvas } from '../hooks/useResolvedCanvas';

/** The command that holds the board's mode. Its `value` is the mode id. */
export const BOARD_MODE_COMMAND = 'board.mode';

/**
 * One way the board can be used — *Explore*, *Edit*, *Annotate* (work: the
 * tools change what a drag does) or *Focus*, *Present* (view: the chrome steps
 * aside). Host-supplied, so each product names its own modes.
 */
export interface BoardModeSpec {
  /** Stable id — what `modes` lists on a control panel or item. */
  id: string;
  /** Picker label. */
  label: string;
  /** Icon name, resolved by the UI kit's icon registry. */
  icon?: string;
  /** One line under the label in the picker — what the mode is for. */
  description?: string;
  /** `'work'` (default) or `'view'`; the picker draws a line between the groups. */
  group?: 'work' | 'view';
  /** Offered but not pickable yet; {@link description} says why. */
  disabled?: boolean;
  /**
   * A key that toggles this mode (and back to {@link BoardModesProps.escapeTo}),
   * with ⌘ / Ctrl when `mod` is set — `{ key: '\\', mod: true }` for Focus.
   */
  shortcut?: { key: string; mod?: boolean };
}

/** A {@link BOARD_MODE_COMMAND} option: the command's option plus the mode's group. */
export type BoardModeOption = CommandOption & { group: 'work' | 'view' };

export interface BoardModesProps {
  /** The modes, in picker order. */
  modes: readonly BoardModeSpec[];
  /** The mode the board opens in. Default: the first mode. */
  defaultMode?: string;
  /** Told after every switch, with the new mode's id. */
  onModeChange?: (mode: string) => void;
  /**
   * Esc returns here from any other mode, unless focus is in a text field.
   * Default: the first mode. `null` turns Esc off.
   */
  escapeTo?: string | null;
}

/**
 * The board's **mode** — a viewer's choice, never saved with the board. Mount it
 * inside the canvas tree; it renders nothing.
 *
 * It registers the {@link BOARD_MODE_COMMAND} pick-one command (`value` = the
 * mode id, `options` = the modes, `run({ value })` switches), so the mode
 * picker, ⌘K and a menu all drive one switch, and `<ControlPanels>` shows only
 * the panels and items whose `modes` include it. Esc goes back to
 * {@link BoardModesProps.escapeTo}; a mode's {@link BoardModeSpec.shortcut}
 * toggles it.
 *
 * ```tsx
 * <GraphCanvasApp data={data}>
 *   <BoardModes modes={[{ id: 'explore', label: 'Explore' }, { id: 'focus', label: 'Focus', group: 'view' }]} />
 *   <ControlPanel id="tools" modes={['explore']} items={…} />
 * </GraphCanvasApp>
 * ```
 */
export function BoardModes({ modes, defaultMode, onModeChange, escapeTo }: BoardModesProps) {
  const canvas = useCanvas();
  const first = modes[0]?.id ?? '';
  const [mode, setMode] = useState<string>(defaultMode ?? first);
  const latest = useRef({ mode, modes, onModeChange });
  latest.current = { mode, modes, onModeChange };

  useEffect(() => {
    const pick = (next: string): void => {
      const spec = latest.current.modes.find((m) => m.id === next);
      if (!spec || spec.disabled || next === latest.current.mode) return;
      setMode(next);
      latest.current.onModeChange?.(next);
    };
    const off = canvas.commands.register(BOARD_MODE_COMMAND, {
      label: 'Mode',
      category: 'View',
      keywords: ['explore', 'edit', 'annotate', 'focus', 'present', 'mode'],
      value: () => latest.current.mode,
      isActive: (_c, args) => (args as { value?: string } | undefined)?.value === latest.current.mode,
      options: (): BoardModeOption[] =>
        latest.current.modes.map((m) => ({
          value: m.id,
          label: m.label,
          group: m.group ?? 'work',
          ...(m.icon ? { icon: m.icon } : {}),
          ...(m.description ? { description: m.description } : {}),
          ...(m.disabled ? { disabled: true } : {}),
        })),
      run: (_c, args) => {
        const next = (args as { value?: string } | undefined)?.value;
        if (next) pick(next);
      },
    });
    return off;
  }, [canvas]);

  // Commands are read lazily; tell their readers the value moved.
  useEffect(() => canvas.commands.invalidate(), [canvas, mode, modes]);

  const home = escapeTo === undefined ? first : escapeTo;
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || typing(e.target) || inOverlay(e.target)) return;
      const { mode: current, modes: list } = latest.current;
      const go = (next: string) => void canvas.commands.run(BOARD_MODE_COMMAND, { value: next });
      for (const m of list) {
        const k = m.shortcut;
        if (k && e.key === k.key && (!k.mod || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          go(current === m.id && home ? home : m.id);
          return;
        }
      }
      if (e.key === 'Escape' && home && current !== home) go(home);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canvas, home]);

  return null;
}

/**
 * A keystroke meant for an open overlay — a menu, a listbox, a dialog — whose
 * Esc closes it, and must not also leave the mode.
 */
function inOverlay(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el?.closest?.('[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]');
}

/** A keystroke meant for a field, not the board. */
function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
}

/**
 * The board's current mode id, live — `null` on a board with no
 * {@link BoardModes}. Reads the {@link BOARD_MODE_COMMAND}'s value.
 */
export function useBoardMode(canvas?: Canvas | null): string | null {
  const resolved = useResolvedCanvas(canvas);
  const { states } = useCommandStates(BOARD_MODE_REFS, resolved);
  return states[0]?.available ? states[0].value : null;
}

const BOARD_MODE_REFS = [{ command: BOARD_MODE_COMMAND }] as const;

/**
 * Whether something limited to `modes` shows in `current`: always when it
 * names no modes, and always on a board with no mode.
 */
export function inBoardMode(modes: readonly string[] | undefined, current: string | null): boolean {
  return !modes || modes.length === 0 || current === null || modes.includes(current);
}
