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

/**
 * A named command, run against a context `C`. `args` is whatever the caller's
 * spec carried (JSON).
 *
 * Its `isEnabled` / `isActive` / `value` / `options` may read anything; a bound
 * control re-reads them on view-store writes and on the registry's
 * {@link CommandRegistry.subscribe} signal. State outside the store needs an
 * owner-side {@link CommandRegistry.invalidate} bridge — see there.
 */
export interface CanvasCommand<C> {
  /** Human label — a default tooltip when a spec doesn't give one. */
  label?: string;
  /**
   * The keys `args` may carry, described for editors (the Studio's control-panel
   * editor draws a field per key). In dev builds {@link CommandRegistry.run}
   * checks a described key's value against its `kind` and warns (never throws)
   * on a mismatch — see {@link CommandRegistryOptions.validateArgs}. Keys it
   * doesn't name still pass through unchecked.
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
  /**
   * Check `args` against each command's {@link CanvasCommand.args} descriptors
   * in {@link CommandRegistry.run}, warning once per (command, key, problem) on
   * a mismatch. Never throws, never blocks the run. Default: on in dev builds
   * (`process.env.NODE_ENV !== 'production'`), off in production bundles.
   */
  validateArgs?: boolean;
}

/**
 * Whether this is a dev build. Written as the literal `process.env.NODE_ENV`
 * so consumer bundlers substitute it (and drop the validator in production);
 * where `process` doesn't exist at all (an unbundled browser) it's `false`.
 */
function isDevBuild(): boolean {
  try {
    // `process` isn't declared in this dependency-free package.
    return (process as { env: { NODE_ENV?: string } }).env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

declare const process: unknown;

/** Why `value` doesn't fit `spec`, or `null` when it does. */
function argProblem(spec: CommandArgSpec, value: unknown): string | null {
  switch (spec.kind) {
    case 'string':
    case 'layer':
    case 'behaviour':
    case 'layout':
      return typeof value === 'string' ? null : `expected a string (${spec.kind}), got ${describe(value)}`;
    case 'number': {
      if (typeof value === 'number' && Number.isFinite(value)) return null;
      // A picker hands its pick back as a string (`camera.zoomTo`'s `value`).
      if (spec.pick && typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return null;
      return `expected a finite number, got ${describe(value)}`;
    }
    case 'boolean':
      return typeof value === 'boolean' ? null : `expected a boolean, got ${describe(value)}`;
    case 'enum': {
      const allowed = (spec.options ?? []).map((o) => o.value);
      return typeof value === 'string' && allowed.includes(value)
        ? null
        : `expected one of ${allowed.map((v) => JSON.stringify(v)).join(', ')}, got ${describe(value)}`;
    }
    case 'strings':
      return Array.isArray(value) && value.every((v) => typeof v === 'string')
        ? null
        : `expected an array of strings, got ${describe(value)}`;
    case 'json':
      return null;
  }
}

function describe(value: unknown): string {
  if (Array.isArray(value)) return 'an array';
  if (value === null) return 'null';
  return typeof value === 'string' ? JSON.stringify(value) : typeof value;
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
  private readonly validateArgs: boolean;
  /** `command|key|problem` already warned about, so a bound button doesn't flood the console. */
  private readonly warned = new Set<string>();

  constructor(opts: CommandRegistryOptions<C>) {
    this.getContext = opts.getContext;
    this.validateArgs = opts.validateArgs ?? isDevBuild();
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
   * is missing or disabled. With `validateArgs` on, first warns about any
   * described key whose value doesn't fit its descriptor — the run proceeds
   * regardless.
   */
  run(name: string, args?: unknown): boolean {
    const cmd = this.get(name);
    if (!cmd) return false;
    if (this.validateArgs && cmd.args) this.checkArgs(name, cmd.args, args);
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
   * Tell subscribers that command state changed **outside** the view store (a
   * history stack, a clipboard buffer, a layer's edge defaults, a registry), so
   * a bound control re-reads `isEnabled` / `isActive` / `value` / `options`.
   *
   * Call it from the state's **owner** — a bridge from the owner's own change
   * signal, set up once (the engine bridges the registries, layer visibility and
   * `canvas.history`; `GraphCanvas` its layers' edge templates; a provider its
   * own history / clipboard) — never from the write sites, where another
   * writer would forget it. A command whose state lives in the view store
   * needs none.
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

  /** Warn (once each) about `args` values that don't fit `specs`. */
  private checkArgs(name: string, specs: Readonly<Record<string, CommandArgSpec>>, args: unknown): void {
    if (args === undefined || args === null) return;
    if (typeof args !== 'object' || Array.isArray(args)) {
      this.warn(name, '', `args should be an object, got ${describe(args)}`);
      return;
    }
    for (const [key, spec] of Object.entries(specs)) {
      const value = (args as Record<string, unknown>)[key];
      if (value === undefined) continue;
      const problem = argProblem(spec, value);
      if (problem) this.warn(name, key, problem);
    }
  }

  private warn(name: string, key: string, problem: string): void {
    const id = `${name}|${key}|${problem}`;
    if (this.warned.has(id)) return;
    this.warned.add(id);
    console.warn(`[canvas] command "${name}"${key ? ` arg "${key}"` : ''}: ${problem}`);
  }

  private notify(): void {
    for (const l of [...this.listeners]) l();
  }
}
