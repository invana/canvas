import { useMemo, useState, useSyncExternalStore, useCallback } from 'react';
import type { Canvas, CommandArgSpec } from '@invana/canvas';
import { useCommandStates, useResolvedCanvas, type CommandRef } from '@invana/canvas-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Dialog,
  DialogContent,
  DialogTitle,
  cn,
} from '@invana/ui';

/** A key binding to show as a hint — the shape of `KeyboardShortcutBinding`. */
export interface CommandPaletteShortcut {
  keys: string;
  command: string;
  args?: unknown;
}

export interface CommandPaletteProps {
  /**
   * `'dialog'` (default) — a modal the host opens and closes. `'inline'` — the
   * list renders in place and stays, for a docked region (`GraphCanvasApp`'s
   * `right`); `open` / `onOpenChange` are ignored.
   */
  variant?: 'dialog' | 'inline';
  /** Whether the dialog is open (controlled). Required for `variant: 'dialog'`. */
  open?: boolean;
  /** Called to open / close the dialog — Escape, a pick, a click outside. */
  onOpenChange?: (open: boolean) => void;
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

/**
 * Whether a command can run with no args — none of its described args is a pick
 * (those expand to one row per option instead) or `required`.
 */
function runsBare(args: Readonly<Record<string, CommandArgSpec>> | undefined): boolean {
  return !Object.values(args ?? {}).some((s) => s.pick || s.required);
}

/** `@invana/ui` `CommandDialog`'s spacing for groups, items and the input. */
const COMMAND_CLASS =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5';

/** Mac glyphs per modifier / key; elsewhere the word. */
const MAC_KEYS: Record<string, string> = {
  mod: '⌘', meta: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧',
  escape: 'Esc', backspace: '⌫', delete: '⌦', enter: '↩', space: 'Space',
};
const PC_KEYS: Record<string, string> = {
  mod: 'Ctrl', meta: 'Win', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift',
  escape: 'Esc', backspace: 'Backspace', delete: 'Del', enter: 'Enter', space: 'Space',
};

/** A binding's first alternative, for display: `mod+shift+z` → `⇧⌘Z` / `Ctrl+Shift+Z`. */
function keyHint(keys: string): string {
  const mac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform ?? '');
  const names = mac ? MAC_KEYS : PC_KEYS;
  const alts = keys.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
  // A Mac's "delete" key is Backspace — show that alternative when there is one.
  const alt = mac && alts[0] === 'delete' && alts.includes('backspace') ? 'backspace' : (alts[0] ?? '');
  const parts = alt.split('+').filter(Boolean);
  // Mac convention orders modifiers ⌃⌥⇧⌘ before the key.
  const order = ['ctrl', 'alt', 'shift', 'mod', 'meta'];
  const mods = parts.filter((p) => order.includes(p)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const rest = parts.filter((p) => !order.includes(p));
  const label = (p: string) => names[p] ?? (p.length === 1 ? p.toUpperCase() : p[0]!.toUpperCase() + p.slice(1));
  return [...mods, ...rest].map(label).join(mac ? '' : '+');
}

/**
 * How well `entry` matches `query` (already lower-cased; `0` = no match): the
 * label exactly, then as a prefix, then a word prefix, then anywhere; then the
 * command name / keywords; then the query's letters in order in the label.
 */
function rank(entry: PaletteEntry, query: string): number {
  const label = entry.label.toLowerCase();
  if (label === query) return 6;
  if (label.startsWith(query)) return 5;
  if (label.split(/[\s:/-]+/).some((w) => w.startsWith(query))) return 4;
  if (label.includes(query)) return 3;
  if (entry.keywords.some((k) => k.toLowerCase().includes(query))) return 2;
  let i = 0;
  for (const ch of label) if (ch === query[i]) i++;
  return i === query.length ? 1 : 0;
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
 * Typing ranks rows by label (exact, prefix, word, anywhere), then name /
 * keywords, then a fuzzy match, and selects the best enabled one — Enter runs it.
 *
 * As a dialog it's controlled: the host decides when it opens (a button, or a
 * key via its own listener). `variant="inline"` renders the list in place.
 */
export function CommandPalette({
  variant = 'dialog',
  open = false,
  onOpenChange,
  commands,
  shortcuts,
  placeholder = 'Type a command…',
  canvas,
}: CommandPaletteProps) {
  const inline = variant === 'inline';
  const resolved = useResolvedCanvas(canvas);

  // Rebuild on every registry signal — (un)registration *and* `invalidate()`,
  // which is how a pick command's `options` changing (a layout added / removed)
  // is announced. A snapshot of the names alone stays equal then.
  const subscribe = useCallback((onChange: () => void) => resolved.commands.subscribe(onChange), [resolved]);
  const getVersion = useCallback(() => resolved.commands.version, [resolved]);
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);

  const entries = useMemo<PaletteEntry[]>(() => {
    if (!inline && !open) return [];
    const only = commands ? new Set(commands) : null;
    const out: PaletteEntry[] = [];
    for (const name of resolved.commands.list()) {
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
    // `version` is the change signal; the body reads the registry directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline, open, version, commands, resolved]);

  const { states, run } = useCommandStates(entries, resolved);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | undefined>(undefined);

  // Rows grouped by category. With a query: only matches, best first, and the
  // groups ordered by their best row (cmdk's own sort can't reorder groups).
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scored = entries
      .map((e, i) => ({ i, score: q ? rank(e, q) : 1 }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i);
    const byGroup = new Map<string, number[]>();
    for (const { i } of scored) byGroup.set(entries[i]!.group, [...(byGroup.get(entries[i]!.group) ?? []), i]);
    return [...byGroup.entries()];
  }, [entries, query]);

  // The highlighted row: the user's (arrow keys / hover) while it's still shown
  // and enabled, else the first enabled row — so Enter runs the best match.
  const current = useMemo(() => {
    const shown = groups.flatMap(([, indexes]) => indexes).filter((i) => states[i]?.enabled);
    const keys = shown.map((i) => entries[i]!.key);
    return selected !== undefined && keys.includes(selected) ? selected : (keys[0] ?? '');
  }, [groups, states, entries, selected]);

  const onQuery = useCallback((q: string) => {
    setQuery(q);
    setSelected(undefined);
  }, []);

  const pick = useCallback(
    (e: PaletteEntry) => {
      run(e.command, e.args);
      onQuery('');
      if (!inline) onOpenChange?.(false);
    },
    [run, onQuery, inline, onOpenChange],
  );

  const hints = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of shortcuts ?? []) {
      const k = s.args === undefined ? s.command : `${s.command}:${JSON.stringify(s.args)}`;
      if (!m.has(k)) m.set(k, keyHint(s.keys));
    }
    return m;
  }, [shortcuts]);

  const list = (
    <Command shouldFilter={false} value={current} onValueChange={setSelected} className={cn(COMMAND_CLASS, inline && 'bg-transparent')}>
      <CommandInput placeholder={placeholder} value={query} onValueChange={onQuery} />
      <CommandList className={inline ? 'max-h-none flex-1' : undefined}>
        <CommandEmpty>No matching command.</CommandEmpty>
        {groups.map(([group, indexes]) => (
          <CommandGroup key={group} heading={group}>
            {indexes.map((i) => {
              const e = entries[i]!;
              const hint = hints.get(e.args === undefined ? e.command : `${e.command}:${JSON.stringify(e.args)}`);
              return (
                <CommandItem key={e.key} value={e.key} disabled={!states[i]?.enabled} onSelect={() => pick(e)}>
                  {e.label}
                  {hint && <CommandShortcut>{hint}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );

  if (inline) return list;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onQuery('');
        onOpenChange?.(o);
      }}
    >
      <DialogContent className="overflow-hidden p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        {list}
      </DialogContent>
    </Dialog>
  );
}
