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

/** A named command, run against a context `C`. `args` is whatever the caller's spec carried (JSON). */
export interface CanvasCommand<C> {
  /** Human label — a default tooltip when a spec doesn't give one. */
  label?: string;
  /** Perform the command. */
  run(ctx: C, args?: unknown): void;
  /** Toggle state for toggle-style controls. Absent ⇒ never active. */
  isActive?(ctx: C, args?: unknown): boolean;
  /** Whether the command can run now. Absent ⇒ always enabled. */
  isEnabled?(ctx: C, args?: unknown): boolean;
}

/** Options for {@link CommandRegistry}. */
export interface CommandRegistryOptions<C> {
  /** The context every command runs against (resolved lazily, per call). */
  getContext: () => C;
}

/**
 * Holds {@link CanvasCommand}s by name and runs them against a bound context.
 * Registering a name that already exists **replaces** it (an app may override a
 * built-in); {@link subscribe} listeners hear every register / unregister so a UI
 * can re-resolve late-arriving commands.
 */
export class CommandRegistry<C> {
  private readonly commands = new Map<string, CanvasCommand<C>>();
  private readonly listeners = new Set<() => void>();
  private readonly getContext: () => C;

  constructor(opts: CommandRegistryOptions<C>) {
    this.getContext = opts.getContext;
  }

  /**
   * Register (or replace) `name`. Returns a disposer that unregisters it — but
   * only if it is still this exact command, so disposing a replaced command
   * never removes its replacement.
   */
  register(name: string, command: CanvasCommand<C>): () => void {
    this.commands.set(name, command);
    this.notify();
    return () => {
      if (this.commands.get(name) === command) this.unregister(name);
    };
  }

  /** Remove `name`. No-op when absent. */
  unregister(name: string): void {
    if (this.commands.delete(name)) this.notify();
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  get(name: string): CanvasCommand<C> | undefined {
    return this.commands.get(name);
  }

  /** Registered command names, in registration order. */
  list(): string[] {
    return [...this.commands.keys()];
  }

  /**
   * Run `name` with `args`. Returns `false` (and does nothing) when the command
   * is missing or disabled.
   */
  run(name: string, args?: unknown): boolean {
    const cmd = this.commands.get(name);
    if (!cmd) return false;
    const ctx = this.getContext();
    if (cmd.isEnabled && !cmd.isEnabled(ctx, args)) return false;
    cmd.run(ctx, args);
    return true;
  }

  /** `isActive` of `name`; `false` when missing or not a toggle. */
  isActive(name: string, args?: unknown): boolean {
    const cmd = this.commands.get(name);
    return cmd?.isActive ? cmd.isActive(this.getContext(), args) : false;
  }

  /** `isEnabled` of `name`; `false` when missing, `true` when it declares no check. */
  isEnabled(name: string, args?: unknown): boolean {
    const cmd = this.commands.get(name);
    if (!cmd) return false;
    return cmd.isEnabled ? cmd.isEnabled(this.getContext(), args) : true;
  }

  /** Hear every register / unregister. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Drop every command and listener. */
  clear(): void {
    this.commands.clear();
    this.notify();
    this.listeners.clear();
  }

  private notify(): void {
    for (const l of [...this.listeners]) l();
  }
}
