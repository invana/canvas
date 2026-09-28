import type { OperationLog, Playbook, PlaybookSpec, StepSpec } from '@invana/canvas-core';

/**
 * What a playbook needs from its canvas — the ordinary canvas methods a step
 * is played with. The engine (`@invana/canvas`) supplies it; tests supply a
 * double. Kept here so the playbook's logic is testable without a renderer.
 *
 * @typeParam S The settings patch shape (`CanvasConfig` in `@invana/canvas`).
 */
export interface PlaybookEnv<S = Record<string, unknown>> {
  /**
   * Check a step before anything is written. Returns the problems found (an
   * unknown command, a view id no source holds, settings that aren't JSON…);
   * empty means the step may play. `source` is the step's resolved source id.
   */
  validate(step: StepSpec<S>, source: string | undefined): string[];
  /**
   * Write the step's state **synchronously** — `data` through the source's
   * `applyDelta`, `settings` through `canvas.update`, `view` through the store
   * actions. Runs inside one log group, so everything it records becomes one
   * entry tagged with the step.
   */
  apply(step: StepSpec<S>, source: string | undefined): void;
  /** Run a command and wait for its work (`commands.runAsync`). Resolves `false` when it can't run. */
  runCommand(name: string, args: Record<string, unknown> | undefined): Promise<boolean>;
  /** Resolve once the canvas has settled (no layout, transition or camera glide). */
  whenSettled(): Promise<void>;
  /** The canvas's session actor — a step with no `actor` is attributed to it. */
  actor(): string;
}

/** Options for {@link createPlaybook}. */
export interface PlaybookOptions<S = Record<string, unknown>> {
  /** Starting script. */
  doc?: PlaybookSpec<S>;
}

/** Thrown by `next` / `goTo` when a step fails {@link PlaybookEnv.validate}. Nothing was written. */
export class PlaybookStepError extends Error {
  constructor(
    /** The step that failed. */
    readonly stepId: string,
    /** Every problem found. */
    readonly problems: readonly string[],
  ) {
    super(`Playbook step "${stepId}" is invalid: ${problems.join('; ')}`);
    this.name = 'PlaybookStepError';
  }
}

/** What playing a step recorded, so moving back and forth reverts / replays it. */
interface Played {
  /** The newest applied entry before the step played (`null` = the log's start). */
  before: string | null;
  /** The newest entry the step recorded, or `null` when it recorded none. */
  last: string | null;
}

/**
 * `canvas.playbook` — the **script** (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, G8 / F13): a
 * list of JSON {@link StepSpec}s and a position.
 *
 * - **`addStep` only appends** (D-8); the canvas does not change until a step
 *   is moved to.
 * - **`next` plays** the following step: validates it (a bad step writes
 *   nothing and throws {@link PlaybookStepError}), writes its `data`,
 *   `settings` and `view` as **one** log entry carrying the step's `stepId`,
 *   `title` and `actor`, then runs its `do` verbs in order (each awaited) and
 *   waits for the canvas to settle. A step already played and then stepped
 *   back over is **replayed** from its recorded entries rather than re-run —
 *   unless a change made meanwhile cut those entries off, in which case it is
 *   played afresh.
 * - **`previous` reverts** the current step: every entry recorded since the
 *   step started is taken back, view intent included.
 * - **`goTo`** moves step by step to any step.
 *
 * Moves are serialised: a `next` called while one is still settling waits for
 * it. History is untouched as a model: the playbook only calls the ordinary
 * canvas methods and the log's `revertTo` / `replayTo`.
 */
export function createPlaybook<S = Record<string, unknown>>(
  log: OperationLog,
  env: PlaybookEnv<S>,
  opts: PlaybookOptions<S> = {},
): Playbook<S> {
  let title = opts.doc?.title ?? 'Playbook';
  let source = opts.doc?.source;
  let steps: StepSpec<S>[] = [];
  /** Index of the step the canvas is at; `-1` before the first. */
  let index = -1;
  const played = new Map<string, Played>();
  const listeners = new Set<() => void>();
  /** The tail of the move queue. */
  let queue: Promise<void> = Promise.resolve();

  const notify = (): void => {
    for (const l of [...listeners]) l();
  };

  const newestApplied = (): string | null => {
    const applied = log.entries();
    return applied.length > 0 ? applied[applied.length - 1]!.id : null;
  };

  const append = (spec: StepSpec<S>): void => {
    if (typeof spec.id !== 'string' || spec.id === '') throw new Error('Playbook.addStep: a step needs an id');
    if (steps.some((s) => s.id === spec.id)) throw new Error(`Playbook.addStep: duplicate step id "${spec.id}"`);
    steps.push(spec);
  };

  if (opts.doc) for (const s of opts.doc.steps) append(s);

  /** Queue `fn` behind any move in flight; the returned promise is this move's. */
  const enqueue = (fn: () => Promise<void>): Promise<void> => {
    const run = queue.then(fn);
    queue = run.catch(() => undefined);
    return run;
  };

  async function runVerbs(step: StepSpec<S>): Promise<void> {
    for (const verb of step.do ?? []) await env.runCommand(verb.command, verb.args);
  }

  /** Play or replay `steps[i]`, which must be the step after the current one. */
  async function forward(i: number): Promise<void> {
    const step = steps[i]!;
    const record = played.get(step.id);
    const replayable =
      record !== undefined && (record.last === null || log.status(record.last) === 'pending');

    if (replayable) {
      if (record.last !== null) log.replayTo(record.last);
    } else {
      const src = step.source ?? source;
      const problems = env.validate(step, src);
      if (problems.length > 0) throw new PlaybookStepError(step.id, problems);
      const before = newestApplied();
      log.group(
        {
          title: step.title,
          actor: step.actor ?? env.actor(),
          stepId: step.id,
        },
        () => env.apply(step, src),
      );
      const after = newestApplied();
      played.set(step.id, { before, last: after !== before ? after : null });
    }
    index = i;
    notify();
    await runVerbs(step);
    await env.whenSettled();
  }

  /** Revert the current step. */
  async function back(): Promise<void> {
    const step = steps[index]!;
    const record = played.get(step.id);
    if (record && record.last !== null) log.revertTo(record.before);
    index--;
    notify();
    await env.whenSettled();
  }

  return {
    get steps() {
      return steps;
    },
    get current() {
      return index >= 0 ? steps[index] : undefined;
    },
    get index() {
      return index;
    },
    get title() {
      return title;
    },

    addStep(spec) {
      append(spec);
      notify();
      return spec.id;
    },

    next: () =>
      enqueue(async () => {
        if (index + 1 < steps.length) await forward(index + 1);
      }),

    previous: () =>
      enqueue(async () => {
        if (index >= 0) await back();
      }),

    goTo: (stepId) =>
      enqueue(async () => {
        const target = steps.findIndex((s) => s.id === stepId);
        if (target < 0) throw new Error(`Playbook.goTo: no step "${stepId}"`);
        while (index > target) await back();
        while (index < target) await forward(index + 1);
      }),

    toJSON() {
      return {
        version: 1,
        title,
        ...(source !== undefined ? { source } : {}),
        steps: steps.map((s) => ({ ...s })),
      };
    },

    load: (doc) =>
      enqueue(async () => {
        if (doc.version !== 1) throw new Error(`Playbook.load: unsupported version ${String(doc.version)}`);
        title = doc.title;
        source = doc.source;
        steps = [];
        played.clear();
        index = -1;
        for (const s of doc.steps) append(s);
        notify();
      }),

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
