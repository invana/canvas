import { useMemo } from 'react';
import type { Canvas } from '@invana/canvas';
import { useCommandStates, useResolvedCanvas, type CommandState } from '@invana/canvas-react';
import type { MenuItem } from '@invana/ui';
import { Check } from 'lucide-react';

import type { ToolbarIcon } from '../components';
import { DEFAULT_CONTROL_ICONS } from '../control-panels/icons';

/** One menu entry bound to a command. */
export interface CommandMenuRef {
  /** The command, by name (`canvas.commands`). */
  command: string;
  /** Args passed to the command. */
  args?: unknown;
  /** Menu label. Default: the command's own `label`, else its name. */
  label?: string;
  /** Icon name from the control-panel icon registry (e.g. `'scissors'`). */
  icon?: string;
  /** Shortcut hint shown on the right (e.g. `'⌘C'`). Display only. */
  shortcut?: string;
  /** Stable item id. Default: the command name (+ `#<n>` when repeated). */
  id?: string;
}

/** Options for {@link commandMenuItems} / {@link useCommandMenuItems}. */
export interface CommandMenuItemsOptions {
  /** Extra / overriding icons by name, merged over `DEFAULT_CONTROL_ICONS`. */
  icons?: Record<string, ToolbarIcon>;
  /** Keep items whose command isn't registered (shown disabled). Default `false`: left out. */
  showUnavailable?: boolean;
}

/** Tailwind classes that mark a disabled command item (`MenuItem` has no `disabled`). */
const DISABLED_CLASS = 'pointer-events-none opacity-50';

/**
 * Build `@invana/ui` `MenuItem`s from command refs and their states. Disabled
 * items render dimmed with no `onClick`; an active toggle shows a check; a
 * pick-one command becomes a submenu of its options, the current one checked.
 */
function buildItems(
  refs: readonly CommandMenuRef[],
  states: readonly CommandState[],
  labelOf: (ref: CommandMenuRef) => string,
  run: (command: string, args?: unknown) => void,
  opts: CommandMenuItemsOptions,
): MenuItem[] {
  const icons = { ...DEFAULT_CONTROL_ICONS, ...opts.icons };
  const seen = new Map<string, number>();
  const items: MenuItem[] = [];
  refs.forEach((ref, i) => {
    const state = states[i];
    if (!state || (!state.available && !opts.showUnavailable)) return;
    const n = seen.get(ref.command) ?? 0;
    seen.set(ref.command, n + 1);
    const id = ref.id ?? (n === 0 ? ref.command : `${ref.command}#${n}`);
    const icon = state.active ? Check : ref.icon ? icons[ref.icon] : undefined;
    const base: MenuItem = {
      id,
      label: labelOf(ref),
      ...(icon ? { icon } : {}),
      ...(ref.shortcut ? { shortcut: ref.shortcut } : {}),
    };
    if (state.options.length > 0) {
      const bag = ref.args && typeof ref.args === 'object' ? (ref.args as Record<string, unknown>) : {};
      items.push({
        ...base,
        ...(state.enabled ? {} : { className: DISABLED_CLASS }),
        children: state.options.map((o) => ({
          id: `${id}:${o.value}`,
          label: o.label,
          ...(o.value === state.value ? { icon: Check } : o.icon && icons[o.icon] ? { icon: icons[o.icon] } : {}),
          ...(state.enabled ? { onClick: () => run(ref.command, { ...bag, value: o.value }) } : { className: DISABLED_CLASS }),
        })),
      });
      return;
    }
    items.push(state.enabled ? { ...base, onClick: () => run(ref.command, ref.args) } : { ...base, className: DISABLED_CLASS });
  });
  return items;
}

/** The state of each ref, read now. */
function readStates(canvas: Canvas, refs: readonly CommandMenuRef[]): CommandState[] {
  const c = canvas.commands;
  return refs.map(({ command, args }) => ({
    available: c.has(command),
    enabled: c.isEnabled(command, args),
    active: c.isActive(command, args),
    value: c.value(command, args),
    options: c.options(command, args),
  }));
}

/**
 * `MenuItem`s for `refs`, read from `canvas`'s commands **now** — for menus
 * built when they open (the `Graph*ContextMenu` `items` builders). Mix them with
 * closure items freely. For a menu that stays mounted, use {@link useCommandMenuItems}.
 *
 * @example
 * ```tsx
 * <GraphNodeContextMenu items={({ canvas }) => [
 *   ...commandMenuItems(canvas, [{ command: 'clipboard.cut', icon: 'scissors' }, { command: 'clipboard.copy', icon: 'copy' }]),
 *   { id: 'inspect', label: 'Inspect', onClick: … },
 * ]} />
 * ```
 */
export function commandMenuItems(
  canvas: Canvas,
  refs: readonly CommandMenuRef[],
  opts: CommandMenuItemsOptions = {},
): MenuItem[] {
  const labelOf = (ref: CommandMenuRef) => ref.label ?? canvas.commands.get(ref.command)?.label ?? ref.command;
  return buildItems(refs, readStates(canvas, refs), labelOf, (command, args) => void canvas.commands.run(command, args), opts);
}

/**
 * {@link commandMenuItems} kept **live**: labels, disabled and checked states
 * follow the commands (`useCommandStates`), so a mounted dropdown re-renders
 * when, say, the selection empties or the clipboard fills.
 */
export function useCommandMenuItems(
  refs: readonly CommandMenuRef[],
  canvas?: Canvas | null,
  opts: CommandMenuItemsOptions = {},
): MenuItem[] {
  const resolved = useResolvedCanvas(canvas);
  const { states, run } = useCommandStates(refs, resolved);
  const { icons, showUnavailable } = opts;
  return useMemo(() => {
    const labelOf = (ref: CommandMenuRef) => ref.label ?? resolved.commands.get(ref.command)?.label ?? ref.command;
    return buildItems(refs, states, labelOf, (command, args) => void run(command, args), {
      ...(icons ? { icons } : {}),
      ...(showUnavailable !== undefined ? { showUnavailable } : {}),
    });
  }, [refs, states, run, resolved, icons, showUnavailable]);
}
