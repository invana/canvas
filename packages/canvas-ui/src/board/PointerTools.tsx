import { ChevronDown } from 'lucide-react';
import type { Canvas } from '@invana/canvas';
import { useCommandStates, useResolvedCanvas } from '@invana/canvas-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  cn,
} from '@invana/ui';

import { Tooltipped, iconButtonSize, useToolbarSize, type ToolbarIcon } from '../components';
import { ACTIVE_CLASS } from '../components/styles';
import { DEFAULT_CONTROL_ICONS } from '../control-panels/icons';

/** The tool that pans: a drag moves the board, nothing is selected or drawn. */
export const HAND_TOOL = 'hand';

/** One way Select picks: its `select.mode` value, label and icon name. */
export interface PointerSelectOption {
  value: string;
  label: string;
  icon: string;
}

/** Select's kinds, in menu order. */
export const POINTER_SELECT_OPTIONS: readonly PointerSelectOption[] = [
  { value: 'click', label: 'Select', icon: 'pointer' },
  { value: 'lasso', label: 'Lasso select', icon: 'lasso' },
  { value: 'brush', label: 'Box select', icon: 'select-box' },
];

export interface PointerToolsProps {
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
  /** Select's kinds. Default {@link POINTER_SELECT_OPTIONS}. */
  options?: readonly PointerSelectOption[];
  /** Extra / overriding icons by name, merged over the control-panel registry. */
  icons?: Record<string, ToolbarIcon>;
}

const REFS = [{ command: 'tool.active' }, { command: 'select.mode' }] as const;

/**
 * **Select ▾ · Hand** — the two pointer tools, one of which is always in hand
 * unless a mode's own tool (Annotate's *Group*, Edit's *Connect*) is.
 *
 * - **Select** shows only the icon of its kind — pointer, lasso or box — and
 *   its menu names them. Picking one takes Select back in hand, even the kind
 *   already set, so the menu is also the way out of Hand or a mode's tool.
 * - **Hand** pans on a drag; nothing is selected, dragged or grouped. Holding
 *   Space borrows it from any tool (`<BoardToolKeys hold>`).
 *
 * Both write commands — `tool.active` (`'select'` / `'hand'`) and
 * `select.mode` — so the row, the keys and ⌘K agree.
 */
export function PointerTools({ canvas, options = POINTER_SELECT_OPTIONS, icons }: PointerToolsProps) {
  const resolved = useResolvedCanvas(canvas);
  const { states, run } = useCommandStates(REFS, resolved);
  const size = iconButtonSize(useToolbarSize());
  const tool = String(states[0]?.value ?? 'select');
  const kind = String(states[1]?.value ?? options[0]?.value ?? '');
  const registry = { ...DEFAULT_CONTROL_ICONS, ...icons };
  const current = options.find((o) => o.value === kind) ?? options[0];
  const KindIcon = current ? registry[current.icon] : undefined;
  const HandIcon = registry.hand!;
  const selecting = tool === 'select';
  const panning = tool === HAND_TOOL;

  const pick = (value: string) => {
    void run('select.mode', { value });
    void run('tool.active', { value: 'select' });
  };

  return (
    <>
      <DropdownMenu>
        <Tooltipped label={current?.label ?? 'Select'}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Select · ${current?.label ?? ''}`}
              aria-pressed={selecting}
              className={cn('gap-0.5 px-1.5', selecting && ACTIVE_CLASS)}
            >
              {KindIcon && <KindIcon />}
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltipped>
        <DropdownMenuContent align="start">
          {/* Nothing checked while another tool is in hand, so the kind already set still picks. */}
          <DropdownMenuRadioGroup value={selecting ? kind : ''} onValueChange={pick}>
            {options.map((o) => {
              const Icon = registry[o.icon];
              return (
                <DropdownMenuRadioItem key={o.value} value={o.value} className="gap-2">
                  {Icon && <Icon className="size-4 shrink-0" />}
                  {o.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltipped label="Hand (hold Space)">
        <Button
          variant="ghost"
          size={size}
          aria-label="Hand"
          aria-pressed={panning}
          className={cn(panning && ACTIVE_CLASS)}
          onClick={() => void run('tool.active', { value: panning ? 'select' : HAND_TOOL })}
        >
          <HandIcon />
        </Button>
      </Tooltipped>
    </>
  );
}
