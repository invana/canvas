import { useMemo, useSyncExternalStore, useCallback } from 'react';
import type { Canvas, CommandArgSpec } from '@invana/canvas';
import { useCommandStates, useResolvedCanvas, type CommandRef } from '@invana/canvas-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@invana/ui';

/** A key binding to show as a hint — the shape of `KeyboardShortcutBinding`. */
export interface CommandPaletteShortcut {
  keys: string;
  command: string;
  args?: unknown;
}

export interface CommandPaletteProps {
  /** Whether the palette is open (controlled). */
  open: boolean;
  /** Called to open / close it — Escape, a pick, a click outside. */
  onOpenChange: (open: boolean) => void;
  /** Only these command names (default: every registered one that can run bare). */
  commands?: readonly string[];
  /** Bindings to show as key hints — pass the ones your `KeyboardShortcutsBehaviour` uses. */
  shortcuts?: readonly CommandPaletteShortcut[];
  /** Search box placeholder. Default `'Type a command…'`. */
  placeholder?: string;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
}

/** One palette row: a command (with fixed args), under a group. */
interface PaletteEntry extends CommandRef {
  key: string;
  label: string;
  group: string;
  keywords: string[];
}

/** Argument kinds that name a registry instance: with no default, the command can't run bare. */
const ID_KINDS = new Set<CommandArgSpec['kind']>(['layer', 'behaviour', 'layout']);

/**
 * Whether a command can run with no args — none of its described args is a pick
 * (those expand to one row per option instead) or an id with no default.
 */
function runsBare(args: Readonly<Record<string, CommandArgSpec>> | undefined): boolean {
  return !Object.values(args ?? {}).some((s) => s.pick || (ID_KINDS.has(s.kind) && s.default === undefined));
}

/** A binding's first alternative, for display (`mod` → ⌘ / Ctrl). */
function keyHint(keys: string): string {
  const mac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform ?? '');
  const first = keys.split(',')[0]?.trim() ?? '';
  return first
    .split('+')
    .map((p) => (p === 'mod' ? (mac ? '⌘' : 'Ctrl') : p.length === 1 ? p.toUpperCase() : p[0]!.toUpperCase() + p.slice(1)))
    .join(mac ? '' : '+');
}

/**
 * A searchable **command palette** over the canvas's commands (`list()` +
 * `get()`), grouped by each command's `category` and matched on its label,
 * name and `keywords`. A command that runs bare is one row; a pick-one command
 * (`select.mode`, `layout.activate`, …) is one row per option. Commands that
 * need an id with no default (`behaviour.toggle`, `layer.visible`) and private
 * `name#…` commands are left out. Rows show live disabled state; picking one
 * runs it and closes the palette.
 *
 * Controlled: the host decides when it opens (a button, or a key via
 * `KeyboardShortcutsBehaviour` / its own listener).
 */
export function CommandPalette({ open, onOpenChange, commands, shortcuts, placeholder = 'Type a command…', canvas }: CommandPaletteProps) {
  const resolved = useResolvedCanvas(canvas);

  // Registered names, re-read on (un)registration.
  const subscribe = useCallback((onChange: () => void) => resolved.commands.subscribe(onChange), [resolved]);
  const getNames = useCallback(() => resolved.commands.list().join('\n'), [resolved]);
  const names = useSyncExternalStore(subscribe, getNames, getNames);

  const entries = useMemo<PaletteEntry[]>(() => {
    if (!open) return [];
    const only = commands ? new Set(commands) : null;
    const out: PaletteEntry[] = [];
    for (const name of names ? names.split('\n') : []) {
      if (name.includes('#') || (only && !only.has(name))) continue;
      const cmd = resolved.commands.get(name);
      if (!cmd) continue;
      const label = cmd.label ?? name;
      const group = cmd.category ?? 'Other';
      const keywords = [name, ...(cmd.keywords ?? [])];
      const pick = Object.entries(cmd.args ?? {}).find(([, s]) => s.pick)?.[0];
      if (pick) {
        for (const o of resolved.commands.options(name)) {
          out.push({ key: `${name}:${o.value}`, command: name, args: { [pick]: o.value }, label: `${label}: ${o.label}`, group, keywords });
        }
      } else if (runsBare(cmd.args)) {
        out.push({ key: name, command: name, label, group, keywords });
      }
    }
    return out;
  }, [open, names, commands, resolved]);

  const { states, run } = useCommandStates(entries, resolved);

  const groups = useMemo(() => {
    const byGroup = new Map<string, number[]>();
    entries.forEach((e, i) => byGroup.set(e.group, [...(byGroup.get(e.group) ?? []), i]));
    return [...byGroup.entries()];
  }, [entries]);

  const hints = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of shortcuts ?? []) {
      const k = s.args === undefined ? s.command : `${s.command}:${JSON.stringify(s.args)}`;
      if (!m.has(k)) m.set(k, keyHint(s.keys));
    }
    return m;
  }, [shortcuts]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        {groups.map(([group, indexes]) => (
          <CommandGroup key={group} heading={group}>
            {indexes.map((i) => {
              const e = entries[i]!;
              const hint = hints.get(e.args === undefined ? e.command : `${e.command}:${JSON.stringify(e.args)}`);
              return (
                <CommandItem
                  key={e.key}
                  value={`${e.label} ${e.key}`}
                  keywords={e.keywords}
                  disabled={!states[i]?.enabled}
                  onSelect={() => {
                    run(e.command, e.args);
                    onOpenChange(false);
                  }}
                >
                  {e.label}
                  {hint && <CommandShortcut>{hint}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
