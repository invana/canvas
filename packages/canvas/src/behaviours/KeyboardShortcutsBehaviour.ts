/**
 * `KeyboardShortcutsBehaviour` — key bindings that run **commands**.
 *
 * Each binding names keys and a command (`{ keys: 'mod+z', command: 'history.undo' }`),
 * so a shortcut does exactly what the matching control-panel button does, and
 * the bindings are plain JSON: they save with the canvas in
 * `definition.behaviours` and edit in the Studio. A binding whose command is
 * missing or disabled is skipped — the key falls through to the browser (so
 * Ctrl+C still copies text when nothing on the canvas is selected).
 *
 * **Keys.** `+`-joined modifiers and one key, case-insensitive, with `,`
 * separating alternatives: `'mod+shift+z, mod+y'`. `mod` is ⌘ on macOS and Ctrl
 * elsewhere; `ctrl`, `alt` (`option`), `shift`, `meta` (`cmd`) are literal.
 * The key is `KeyboardEvent.key` lowercased (`z`, `delete`, `escape`,
 * `arrowup`, `space`, …) — see {@link normalizeShortcut}. Two rules make
 * modified keys match what you'd write:
 *
 * - **Letters and digits are the key pressed.** Under a modifier, when the typed
 *   character isn't a plain letter or digit (macOS ⌥Z types `Ω`, ⇧1 types `!`),
 *   the key comes from `KeyboardEvent.code` (`KeyZ` → `z`, `Digit1` → `1`) — so
 *   `alt+z` and `shift+1` work. A layout that types a letter keeps it (AZERTY's
 *   Ctrl+Z is still `mod+z`, though that key is `KeyW`).
 * - **Punctuation is the glyph typed.** Write the character, not the keys that
 *   produce it: `mod+plus` (not `mod+shift+=`), `?`. The Shift needed to type
 *   it may be held or not — `mod+plus` fires on Ctrl/⌘ + Shift + `=`.
 *
 * **Scope.** With `scope: 'canvas'` (default) a key is handled only when this
 * canvas is the one in use: focus is inside its scope root, or focus is on the
 * page body and the last pointer-down landed inside it. The scope root is the
 * canvas element's closest `[data-canvas-scope]` ancestor (`GraphCanvasApp`
 * marks its shell), else the canvas element's parent — so two canvases on one
 * page never both undo. `'document'` handles every key on the page. Keys typed
 * into inputs, textareas, selects and contenteditable elements are never taken.
 *
 * Opt-in like every behaviour (rule 7): register it and enable it. Nothing is
 * bound by default — pass {@link DEFAULT_SHORTCUTS} for the usual editor keys.
 */

import { Behaviour, type BehaviourOptions } from '@invana/canvas-core';
import type { CanvasContext } from '@invana/canvas-core';

/** One key binding — pure JSON. */
export interface KeyboardShortcutBinding {
  /** Keys, e.g. `'mod+z'`; `,` separates alternatives (`'delete, backspace'`). */
  keys: string;
  /** The command to run, by name (`canvas.commands`). */
  command: string;
  /** Args passed to the command. Must be JSON. */
  args?: unknown;
}

export interface KeyboardShortcutsBehaviourOptions extends BehaviourOptions {
  /** The bindings, first match wins. Default: none. */
  bindings?: readonly KeyboardShortcutBinding[];
  /** Where keys are heard — `'canvas'` (default) or the whole `'document'`. */
  scope?: 'canvas' | 'document';
}

/**
 * The usual editor keys: undo / redo, cut / copy / paste, delete the selection,
 * and Escape back to the select tool. Every command here is built into
 * `GraphCanvas`; on a plain `Canvas` the missing ones are skipped. Never applied
 * automatically — pass it as `bindings`.
 */
export const DEFAULT_SHORTCUTS: readonly KeyboardShortcutBinding[] = [
  { keys: 'mod+z', command: 'history.undo' },
  { keys: 'mod+shift+z, mod+y', command: 'history.redo' },
  { keys: 'mod+x', command: 'clipboard.cut' },
  { keys: 'mod+c', command: 'clipboard.copy' },
  { keys: 'mod+v', command: 'clipboard.paste' },
  { keys: 'delete, backspace', command: 'clipboard.delete' },
  { keys: 'escape', command: 'tool.active', args: { value: 'select' } },
];

/** The event fields a shortcut is matched on (a `KeyboardEvent` satisfies it). */
export interface ShortcutKeyEvent {
  key: string;
  /**
   * The physical key (`KeyZ`, `Digit1`, …). Optional: without it, letters and
   * digits typed under a modifier match only as the character they produced.
   */
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  target?: EventTarget | null;
}

const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'meta'] as const;

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  del: 'delete',
  return: 'enter',
  ' ': 'space',
  spacebar: 'space',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  plus: '+',
};

const MODIFIER_ALIASES: Record<string, (typeof MODIFIER_ORDER)[number]> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
};

/** Whether this is an Apple platform, where `mod` means ⌘. */
export function isMacPlatform(): boolean {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  return /mac|iphone|ipad|ipod/i.test(nav?.platform ?? nav?.userAgent ?? '');
}

/** A combo as `ctrl+alt+shift+meta+key` (modifiers in that order, present ones only). */
function comboString(mods: ReadonlySet<string>, key: string): string {
  return [...MODIFIER_ORDER.filter((m) => mods.has(m)), key].join('+');
}

/**
 * Normalise a binding's `keys` to canonical combos — one per `,`-separated
 * alternative — so `'Mod+Shift+Z'` on macOS is `['shift+meta+z']`. Unknown
 * modifier words are treated as the key. Empty alternatives are dropped.
 *
 * @param keys The binding's keys, e.g. `'mod+z, ctrl+y'`.
 * @param mac  Whether `mod` means ⌘ (else Ctrl). Default: {@link isMacPlatform}.
 */
export function normalizeShortcut(keys: string, mac = isMacPlatform()): string[] {
  const out: string[] = [];
  for (const alt of keys.split(',')) {
    // `+` is also a key: `ctrl++` → parts `ctrl`, `` , `` → key `+`.
    const parts = alt.trim().toLowerCase().split('+');
    if (parts.length > 1 && parts[parts.length - 1] === '' && parts[parts.length - 2] === '') parts.splice(-2, 2, '+');
    const mods = new Set<string>();
    let key = '';
    for (const raw of parts) {
      const part = raw.trim();
      if (part === '') continue;
      if (part === 'mod') mods.add(mac ? 'meta' : 'ctrl');
      else if (MODIFIER_ALIASES[part]) mods.add(MODIFIER_ALIASES[part]);
      else key = KEY_ALIASES[part] ?? part;
    }
    if (key) out.push(comboString(mods, key));
  }
  return out;
}

/** An ASCII letter or digit — the keys resolved physically under a modifier. */
const ALNUM = /^[a-z0-9]$/;

/** `KeyZ` → `z`, `Digit1` → `1`; anything else (punctuation, numpad, …) → `undefined`. */
function physicalAlnum(code: string | undefined): string | undefined {
  const m = code ? /^(?:Key([A-Z])|Digit([0-9]))$/.exec(code) : null;
  return m ? (m[1] ?? m[2])!.toLowerCase() : undefined;
}

/** The event's modifier set. */
function eventMods(e: ShortcutKeyEvent): Set<string> {
  const mods = new Set<string>();
  if (e.ctrlKey) mods.add('ctrl');
  if (e.altKey) mods.add('alt');
  if (e.shiftKey) mods.add('shift');
  if (e.metaKey) mods.add('meta');
  return mods;
}

/**
 * A keyboard event as a canonical combo (see {@link normalizeShortcut}), or
 * `null` for a bare modifier press. Under a modifier, a typed character that
 * isn't a plain letter / digit (macOS ⌥Z → `Ω`, ⇧1 → `!`, a dead key) is
 * replaced by the physical letter / digit from `e.code` when there is one.
 */
export function eventShortcut(e: ShortcutKeyEvent): string | null {
  const raw = e.key.toLowerCase();
  if (raw === 'control' || raw === 'alt' || raw === 'shift' || raw === 'meta' || raw === 'os') return null;
  const mods = eventMods(e);
  let key = KEY_ALIASES[raw] ?? raw;
  if (mods.size > 0 && !ALNUM.test(key)) key = physicalAlnum(e.code) ?? key;
  return comboString(mods, key);
}

/**
 * Every combo `e` may match: {@link eventShortcut}'s, plus — when Shift is held
 * to type a punctuation glyph (`+`, `?`, `!`) — the same combo without `shift`,
 * so a binding written as the glyph (`mod+plus`) fires.
 */
function eventCandidates(e: ShortcutKeyEvent): string[] {
  const combo = eventShortcut(e);
  if (!combo) return [];
  const out = [combo];
  const raw = e.key.toLowerCase();
  const key = KEY_ALIASES[raw] ?? raw;
  if (e.shiftKey && [...key].length === 1 && key !== ' ' && !ALNUM.test(key)) {
    const mods = eventMods(e);
    mods.delete('shift');
    out.push(comboString(mods, key));
  }
  return out;
}

/** Whether `target` is somewhere the user types (keys belong to it, not the canvas). */
function isEditable(target: EventTarget | null | undefined): boolean {
  const el = target as (HTMLElement & { isContentEditable?: boolean }) | null | undefined;
  const tag = el?.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable === true;
}

export class KeyboardShortcutsBehaviour extends Behaviour<KeyboardShortcutsBehaviourOptions> {
  override readonly kind = 'keyboard-shortcuts';

  private readonly mac = isMacPlatform();
  private onKeyDown?: (e: KeyboardEvent) => void;
  private onPointerDown?: (e: PointerEvent) => void;
  /** Whether the last pointer-down on the page landed inside the scope root. */
  private lastPointerInside = false;

  constructor(opts: KeyboardShortcutsBehaviourOptions) {
    // The bound keys, as the advisory gesture-conflict labels.
    const labels = (opts.bindings ?? []).flatMap((b) => b.keys.split(',').map((k) => k.trim()).filter(Boolean));
    super({ ...opts, shortcuts: opts.shortcuts ?? labels });
  }

  private get bindings(): readonly KeyboardShortcutBinding[] {
    return this._options.bindings ?? [];
  }

  protected onRegister(_ctx: CanvasContext): void {
    /* wired on enable */
  }

  protected override onEnable(): void {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    this.onKeyDown = (e) => {
      if (this.inScope(e.target)) this.handleKey(e);
    };
    this.onPointerDown = (e) => {
      const root = this.scopeRoot();
      this.lastPointerInside = root !== null && e.target instanceof Node && root.contains(e.target);
    };
    document.addEventListener('keydown', this.onKeyDown);
    // Capture, so a handler that stops propagation can't hide the click.
    document.addEventListener('pointerdown', this.onPointerDown, true);
  }

  protected override onDisable(): void {
    if (this.onKeyDown) document.removeEventListener('keydown', this.onKeyDown);
    if (this.onPointerDown) document.removeEventListener('pointerdown', this.onPointerDown, true);
    this.onKeyDown = undefined;
    this.onPointerDown = undefined;
  }

  /**
   * Run the first binding matching `e` whose command is registered and enabled.
   * Returns whether one ran — and then calls `e.preventDefault()` when the event
   * has it. Keys typed into editable elements are ignored. Scope is checked by
   * the DOM listener, not here, so this is callable directly.
   */
  handleKey(e: ShortcutKeyEvent & { preventDefault?: () => void }): boolean {
    const commands = this.ctx?.commands;
    if (!commands || isEditable(e.target)) return false;
    const combos = eventCandidates(e);
    if (combos.length === 0) return false;
    for (const binding of this.bindings) {
      const keys = normalizeShortcut(binding.keys, this.mac);
      if (!combos.some((c) => keys.includes(c))) continue;
      if (!commands.isEnabled(binding.command, binding.args)) continue;
      commands.run(binding.command, binding.args);
      e.preventDefault?.();
      return true;
    }
    return false;
  }

  /** The element keys must come from (or follow a click inside) — see the class doc. */
  private scopeRoot(): Element | null {
    const el = this.ctx?.canvasElement;
    if (!el) return null;
    return el.closest('[data-canvas-scope]') ?? el.parentElement ?? el;
  }

  private inScope(target: EventTarget | null): boolean {
    if ((this._options.scope ?? 'canvas') === 'document') return true;
    const root = this.scopeRoot();
    if (!root) return false;
    if (target instanceof Node && root.contains(target)) return true;
    // Nothing focusable was clicked: focus stays on the body.
    const onPage = target === null || target === document.body || target === document.documentElement;
    return onPage && this.lastPointerInside;
  }
}
