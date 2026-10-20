// BoardToolKeys — a board mode's tools on single keys, and a held key that borrows one.
//
// A mode that draws (Edit: *Add node*, *Connect*) picks its tools from the
// keyboard: a key toggles its tool on and back to Select, and a held key — Shift
// for *Connect* — switches to a tool until it is let go, when the tool in hand
// comes back. Only while the board is in `mode`, never while typing in a field,
// never with ⌘ / Ctrl / Alt. Renders nothing; drives the `tool.active` command,
// so the row's toggles and these keys always agree.

import { useEffect } from 'react';

import { useCanvas } from '../CanvasContext';
import { BOARD_MODE_COMMAND } from './BoardModes';

export interface BoardToolKeysProps {
  /** The board mode the keys belong to. Default `'edit'`. */
  mode?: string;
  /** Key → tool it toggles. Default `{ n: 'add', c: 'connect' }` (case ignored). */
  keys?: Readonly<Record<string, string>>;
  /** A key held down switches to this tool until it is let go. Default Shift → `'connect'`; `null` turns it off. */
  hold?: { key: string; tool: string } | null;
  /** The tool a toggled key returns to. Default `'select'`. */
  rest?: string;
}

const DEFAULT_KEYS = { n: 'add', c: 'connect' } as const;
const DEFAULT_HOLD = { key: 'Shift', tool: 'connect' } as const;

/**
 * Edit's keys, declared once:
 *
 * ```tsx
 * <BoardModes modes={MODES} />
 * <BoardToolKeys />                          // N · C · hold Shift, in Edit
 * <BoardToolKeys mode="annotate" keys={{ s: 'note', r: 'shape' }} hold={null} />
 * ```
 */
export function BoardToolKeys({ mode = 'edit', keys = DEFAULT_KEYS, hold = DEFAULT_HOLD, rest = 'select' }: BoardToolKeysProps) {
  const canvas = useCanvas();
  useEffect(() => {
    const byKey = new Map(Object.entries(keys).map(([k, tool]) => [k.toLowerCase(), tool]));
    let held: string | null = null;
    const active = () => canvas.commands.value(BOARD_MODE_COMMAND) === mode;
    const typing = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]') !== null;
    const tool = (value: string) => void canvas.commands.run('tool.active', { value });
    const release = () => {
      if (held === null) return;
      tool(held);
      held = null;
    };
    const down = (e: KeyboardEvent) => {
      if (!active() || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const current = String(canvas.commands.value('tool.active') ?? rest);
      if (hold && e.key === hold.key) {
        if (held === null && current !== hold.tool) {
          held = current;
          tool(hold.tool);
        }
        return;
      }
      const picked = byKey.get(e.key.toLowerCase());
      if (picked) tool(current === picked ? rest : picked);
    };
    const up = (e: KeyboardEvent) => {
      if (hold && e.key === hold.key) release();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
    };
  }, [canvas, mode, keys, hold, rest]);
  return null;
}
