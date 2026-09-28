/**
 * `CommandRegistry` — named, serialisable-by-reference actions.
 *
 * Serialisable UI (control panels today; shortcuts and menus later) can't hold
 * closures, so it names what it does — `'camera.fit'`, `'view.lock'` — and this
 * registry resolves the name to behaviour at run time. Names are
 * `namespace.verb`; the engine registers its built-ins, a domain package or an
 * app adds its own.
 *
 * Generic over the context `C` a command runs against (the engine binds it to
 * its `Canvas`), so the kernel stays free of any engine type.
 */

/** One option of a pick-one command (see {@link CanvasCommand.options}). */
export interface CommandOption {
  /** The value passed back to `run` as `args.value` when picked. */
  value: string;
  /** Human label. */
  label: string;
  /** Icon name, resolved by the UI kit's icon registry. */
  icon?: string;
}

/**
 * The value kinds a {@link CommandArgSpec} can describe. The first five are
 * plain JSON values; `layer` / `behaviour` / `layout` are the **id** of a
 * registered instance (an editor offers the live registry as choices); `json`
 * is any JSON value the editor can only take as text (maps, number lists).
 */
export type CommandArgKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'strings'
  | 'layer'
  | 'behaviour'
  | 'layout'
  | 'json';

/**
 * Describes one key of a command's `args` bag — plain data, so the kernel stays
 * UI-free; the UI kit maps it to a form field. Optional on every command: an
 * undescribed command (or key) is still editable as raw JSON.
 */
export interface CommandArgSpec {
  /** The value's kind. */
  kind: CommandArgKind;
  /** Field label. Default: the key. */
  label?: string;
  /** One-line help shown under the field. */
  description?: string;
  /** The value the command uses when the key is absent — shown as a hint, never written. */
  default?: unknown;
  /** The allowed values, for `kind: 'enum'`. */
  options?: readonly CommandOption[];
  /**
   * The key a **pick-one** control supplies itself (`value` — see
   * {@link CanvasCommand.value}). An editor hides it on a `choice` item, where
   * picking sets it, and shows it on a button / toggle, where it's fixed.
   */
  pick?: boolean;
}

/** A named command, run against a context `C`. `args` is whatever the caller's spec carried (JSON). */
export interface CanvasCommand<C> {
  /** Human label — a default tooltip when a spec doesn't give one. */
  label?: string;
  /**
   * The keys `args` may carry, described for editors (the Studio's control-panel
   * editor draws a field per key). Documentation as data: it isn't validated at
   * run time, and keys it doesn't name still pass through.
   */
  args?: Readonly<Record<string, CommandArgSpec>>;
  /** Perform the command. */
  run(ctx: C, args?: unknown): void;
  /** Toggle state for toggle-style controls. Absent ⇒ never active. */
  isActive?(ctx: C, args?: unknown): boolean;
  /** Whether the command can run now. Absent ⇒ always enabled. */
  isEnabled?(ctx: C, args?: unknown): boolean;
  /**
   * Current value, for a **pick-one** command (select mode, edge type, active
   * layout). Picking an option runs the command with `{ ...args, value }`.
   * `null` when nothing is picked.
   */
  value?(ctx: C, args?: unknown): string | null;
  /** The options a pick-one command offers. A spec's own `options` take precedence. */
  options?(ctx: C, args?: unknown): CommandOption[];
}

/** Options for {@link CommandRegistry}. */
export interface CommandRegistryOptions<C> {
  /** The context every command runs against (resolved lazily, per call). */
  getContext: () => C;
}

/**
 * Holds {@link CanvasCommand}s by name and runs them against a bound context.
 *
 * Registrations **stack** per name: registering a name that already exists
 * overrides it (a provider upgrading `graph.clear` to its undoable form, an app
 * replacing a built-in), and disposing an override restores whatever is
 * underneath — in any disposal order. {@link subscribe} listeners hear every
 * register / unregister and every {@link invalidate}, so a UI can re-read
 * command state.
 */
export class CommandRegistry<C> {
  /** Per name, the registrations oldest → newest; the last one is live. */
  private readonly stacks = new Map<string, Array<{ command: CanvasCommand<C> }>>();
  private readonly listeners = new Set<() => void>();
  private readonly getContext: () => C;

  constructor(opts: CommandRegistryOptions<C>) {
    this.getContext = opts.getContext;
  }

  /**
   * Register `name`, overriding any existing registration. Returns a disposer
   * that removes **this** registration only: if it is live, the one underneath
   * becomes live again; if it was already overridden, the override stays.
   */
  register(name: string, command: CanvasCommand<C>): () => void {
    // A fresh wrapper per call, so registering the same command twice still
    // yields two independently disposable entries.
    const entry = { command };
    const stack = this.stacks.get(name) ?? [];
    stack.push(entry);
    this.stacks.set(name, stack);
    this.notify();
    return () => {
      const current = this.stacks.get(name);
      const i = current?.indexOf(entry) ?? -1;
      if (!current || i < 0) return;
      current.splice(i, 1);
      if (current.length === 0) this.stacks.delete(name);
      this.notify();
    };
  }

  /** Remove every registration of `name`. No-op when absent. */
  unregister(name: string): void {
    if (this.stacks.delete(name)) this.notify();
  }

  has(name: string): boolean {
    return this.stacks.has(name);
  }

  /** The live (most recent) registration of `name`. */
  get(name: string): CanvasCommand<C> | undefined {
    const stack = this.stacks.get(name);
    return stack?.[stack.length - 1]?.command;
  }

  /** Registered command names, in first-registration order. */
  list(): string[] {
    return [...this.stacks.keys()];
  }

  /**
   * Run `name` with `args`. Returns `false` (and does nothing) when the command
   * is missing or disabled.
   */
  run(name: string, args?: unknown): boolean {
    const cmd = this.get(name);
    if (!cmd) return false;
    const ctx = this.getContext();
    if (cmd.isEnabled && !cmd.isEnabled(ctx, args)) return false;
    cmd.run(ctx, args);
    return true;
  }

  /** `isActive` of `name`; `false` when missing or not a toggle. */
  isActive(name: string, args?: unknown): boolean {
    const cmd = this.get(name);
    return cmd?.isActive ? cmd.isActive(this.getContext(), args) : false;
  }

  /** `isEnabled` of `name`; `false` when missing, `true` when it declares no check. */
  isEnabled(name: string, args?: unknown): boolean {
    const cmd = this.get(name);
    if (!cmd) return false;
    return cmd.isEnabled ? cmd.isEnabled(this.getContext(), args) : true;
  }

  /** `value` of a pick-one command; `null` when missing or not a picker. */
  value(name: string, args?: unknown): string | null {
    const cmd = this.get(name);
    return cmd?.value ? cmd.value(this.getContext(), args) : null;
  }

  /** `options` of a pick-one command; `[]` when missing or it declares none. */
  options(name: string, args?: unknown): CommandOption[] {
    const cmd = this.get(name);
    return cmd?.options ? cmd.options(this.getContext(), args) : [];
  }

  /**
   * Tell subscribers that command state changed **outside** anything they
   * already watch (a history stack, a clipboard buffer, a layer's edge
   * defaults), so a bound control re-reads `isEnabled` / `isActive` / `value`.
   */
  invalidate(): void {
    this.notify();
  }

  /** Hear every register / unregister / {@link invalidate}. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Drop every command and listener. */
  clear(): void {
    this.stacks.clear();
    this.notify();
    this.listeners.clear();
  }

  private notify(): void {
    for (const l of [...this.listeners]) l();
  }
}
