import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Canvas, CommandOption, ControlItemSpec } from '@invana/canvas';
import { ControlPanel, inBoardMode, useBoardMode, useCanvas } from '@invana/canvas-react';
import { FloatingPanel } from '@invana/ui';

/** The command that opens a board panel: `run({ value: id })` toggles it, `value` is the open one. */
export const BOARD_PANEL_COMMAND = 'board.panel';

/** One panel the rail opens — Legend, Styling, History, Export, Properties… */
export interface BoardPanelSpec {
  /** Stable id — the `board.panel` command's `value`. */
  id: string;
  /** Rail tooltip and the panel's title. */
  title: string;
  /** Rail icon, by name in the control-panel icon registry. */
  icon: string;
  /** The panel's content — usually a `*ViewPanel`. */
  render: (canvas: Canvas) => ReactNode;
  /** Beside the title — `7 types`, `12 entries`. */
  count?: ReactNode;
  /** The panel's own controls in its bar — *Show all*, undo · redo. */
  actions?: ReactNode;
  /** Board modes the panel is offered in. Default: every mode. */
  modes?: string[];
  /** Draw a line above its rail icon — Export sits apart from the views. */
  separatorBefore?: boolean;
}

export interface BoardPanelsProps {
  /** The panels, in rail order. */
  panels: readonly BoardPanelSpec[];
  /** The panel open when the board opens. Default none. */
  defaultOpen?: string | null;
  /** Told when a panel opens (its id) or closes (`null`). */
  onOpenChange?: (id: string | null) => void;
  /** Distance from the board's edge, px. Default `12`. */
  offset?: number;
  /** Panel width, px. Default `300`. */
  width?: number;
  /**
   * Board modes the rail and its panel show in — the work modes, so Focus and
   * Present keep the board clear. Default: every mode a panel names, or every
   * mode when a panel names none.
   */
  modes?: string[];
}

/** The rail is one 26 px column of controls inside a 2 px hairline surface. */
const RAIL_W = 32;
/** Between the rail and the open panel. */
const GAP = 6;

/**
 * The board's **panel rail** and its one floating panel. The rail sits
 * top-right — one icon per panel, a line before any marked
 * `separatorBefore` — and the open panel floats left of it on the kit's
 * `FloatingPanel` (title · count · its actions · ✕). One panel at a time:
 * opening another replaces it, its icon or ✕ closes it.
 *
 * The rail is a saved `<ControlPanel id="board-rail">` of `board.panel`
 * toggles, so ⌘K and a menu can open a panel too. A panel limited to `modes`
 * leaves the rail in other modes, and the board's modes decide whether the rail
 * shows at all (`modes` on the rail are the union of its panels').
 */
export function BoardPanels({ panels, defaultOpen = null, onOpenChange, offset = 12, width = 300, modes }: BoardPanelsProps) {
  const canvas = useCanvas();
  const mode = useBoardMode(canvas);
  const [open, setOpen] = useState<string | null>(defaultOpen);
  const latest = useRef({ open, panels, onOpenChange });
  latest.current = { open, panels, onOpenChange };

  useEffect(() => {
    const set = (next: string | null): void => {
      setOpen(next);
      latest.current.onOpenChange?.(next);
    };
    return canvas.commands.register(BOARD_PANEL_COMMAND, {
      label: 'Panel',
      category: 'View',
      value: () => latest.current.open,
      isActive: (_c, args) => (args as { value?: string } | undefined)?.value === latest.current.open,
      options: (): CommandOption[] => latest.current.panels.map((p) => ({ value: p.id, label: p.title, icon: p.icon })),
      run: (_c, args) => {
        const value = (args as { value?: string | null } | undefined)?.value ?? null;
        set(value === latest.current.open ? null : value);
      },
    });
  }, [canvas]);
  useEffect(() => canvas.commands.invalidate(), [canvas, open]);

  const items: ControlItemSpec[] = panels.flatMap((p): ControlItemSpec[] => [
    ...(p.separatorBefore ? [{ type: 'divider' as const, ...(p.modes ? { modes: p.modes } : {}) }] : []),
    {
      type: 'toggle',
      key: p.id,
      command: BOARD_PANEL_COMMAND,
      args: { value: p.id },
      icon: p.icon,
      label: p.title,
      ...(p.modes ? { modes: p.modes } : {}),
    },
  ]);
  const everywhere = panels.some((p) => !p.modes);
  const railModes = modes ?? (everywhere ? undefined : [...new Set(panels.flatMap((p) => p.modes ?? []))]);

  const shown = panels.find((p) => p.id === open && inBoardMode(p.modes, mode) && inBoardMode(railModes, mode));

  return (
    <>
      <ControlPanel
        id="board-rail"
        position="top-right"
        offset={offset}
        orientation="vertical"
        surface="hairline"
        {...(railModes ? { modes: railModes } : {})}
        items={items}
      />
      {shown && (
        <div
          className="pointer-events-auto absolute z-[6] flex"
          // The slot hugs the rail: its right edge is the rail's left plus the gap.
          style={{ top: offset, right: offset + RAIL_W + GAP, width, maxHeight: `calc(100% - ${2 * offset}px)` }}
        >
          <FloatingPanel
            title={shown.title}
            aside={shown.count}
            actions={shown.actions}
            onClose={() => void canvas.commands.run(BOARD_PANEL_COMMAND, { value: shown.id })}
            className="w-full"
          >
            {shown.render(canvas)}
          </FloatingPanel>
        </div>
      )}
    </>
  );
}
