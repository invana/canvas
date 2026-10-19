import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Canvas } from '@invana/canvas';
import { BOARD_MODE_COMMAND, useCommandStates, useResolvedCanvas, type BoardModeOption } from '@invana/canvas-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@invana/ui';

import type { ToolbarIcon } from '../components';
import { DEFAULT_CONTROL_ICONS } from '../control-panels/icons';

export interface BoardModePickerProps {
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
  /** Extra / overriding icons by name, merged over the control-panel registry. */
  icons?: Record<string, ToolbarIcon>;
  /** Headings over the two groups. Default `Work` and `View`. */
  groupLabels?: { work?: string; view?: string };
}

const REFS = [{ command: BOARD_MODE_COMMAND }] as const;

/**
 * The board's mode picker — the current mode's icon and name; its menu lists
 * the work modes, a line, then the view modes, each with its one line. Drives
 * the `board.mode` command, so it agrees with ⌘K and Esc. Renders nothing on a
 * board with no `<BoardModes>`.
 */
export function BoardModePicker({ canvas, icons, groupLabels }: BoardModePickerProps) {
  const resolved = useResolvedCanvas(canvas);
  const { states, run } = useCommandStates(REFS, resolved);
  const state = states[0];
  if (!state?.available) return null;

  const options = state.options as BoardModeOption[];
  const registry = { ...DEFAULT_CONTROL_ICONS, ...icons };
  const current = options.find((o) => o.value === state.value);
  const Icon = current?.icon ? registry[current.icon] : undefined;
  const groups = (['work', 'view'] as const)
    .map((g) => ({ g, list: options.filter((o) => (o.group ?? 'work') === g) }))
    .filter(({ list }) => list.length > 0);
  const heading = { work: groupLabels?.work ?? 'Work', view: groupLabels?.view ?? 'View' };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Mode · ${current?.label ?? ''}`} className="gap-1.5 px-2 font-medium">
          {Icon && <Icon />}
          {current?.label}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuRadioGroup value={state.value ?? ''} onValueChange={(value) => void run(BOARD_MODE_COMMAND, { value })}>
          {groups.map(({ g, list }, i) => (
            <Fragment key={g}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-muted-foreground text-xs">{heading[g]}</DropdownMenuLabel>
              {list.map((o) => {
                const OptionIcon = o.icon ? registry[o.icon] : undefined;
                return (
                  <DropdownMenuRadioItem key={o.value} value={o.value} disabled={o.disabled} className="items-start gap-2">
                    {OptionIcon && <OptionIcon className="mt-0.5 size-4 shrink-0" />}
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{o.label}</span>
                      {o.description && <span className="text-muted-foreground text-xs">{o.description}</span>}
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
