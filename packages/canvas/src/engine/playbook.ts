import type { CameraIntent, OperationLog, PlaybookEnv, StepSpec } from '@invana/canvas-store';

import { findSerialisationViolations } from './assertSerialisable';
import type { Canvas } from './Canvas';
import type { CanvasConfig } from './CanvasConfig';

/** The camera intents a step may name. */
const CAMERA_INTENTS: ReadonlySet<CameraIntent> = new Set(['focus', 'visible', 'all']);

/** The action a step's `settings` are written with — `edit:*`, so plain undo takes them back. */
export const PLAYBOOK_SETTINGS_ACTION = 'edit:playbook';

/**
 * Check a playbook step against a canvas **before anything is written** (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F13). Returns
 * every problem found; empty means the step may play.
 *
 * - `id` and `title` are strings;
 * - `data` names a registered source with a data door (`source`, or the
 *   playbook's), and is JSON;
 * - every edge in `data.added` ends on nodes that exist after the step's own
 *   removals and additions (the source holds them, or the step adds them);
 * - `settings` is JSON (no functions, no class instances);
 * - every id in `view` (select / focus / inspect) is held by a registered
 *   source, or added by this step's own `data`;
 * - `view.camera` is `'focus'`, `'visible'` or `'all'`;
 * - every `do` verb names a registered command.
 *
 * @param source The step's resolved source id (its own, else the playbook's).
 */
export function validateStepSpec(
  canvas: Canvas,
  log: OperationLog,
  step: StepSpec<CanvasConfig>,
  source: string | undefined,
): string[] {
  const problems: string[] = [];
  if (typeof step.id !== 'string' || step.id === '') problems.push('id must be a non-empty string');
  if (typeof step.title !== 'string') problems.push('title must be a string');

  if (step.data) {
    const adapter = source === undefined ? undefined : log.source(source);
    if (source === undefined) problems.push('data needs a source (the step\'s `source` or the playbook\'s)');
    else if (!adapter?.applyDelta) problems.push(`no data source "${source}" takes deltas`);
    for (const v of findSerialisationViolations(step.data, 'data')) problems.push(v);
    // An added edge must end on nodes that exist once the step's removals and
    // additions are applied — the door throws otherwise, half-way through.
    if (adapter?.hasElement) {
      const addedNodes = new Set((step.data.added?.nodes ?? []).map((n) => n.id));
      const removedNodes = new Set(step.data.removed?.nodeIds ?? []);
      const exists = (id: unknown): boolean =>
        typeof id === 'string' && (addedNodes.has(id) || (!removedNodes.has(id) && adapter.hasElement!(id)));
      for (const e of step.data.added?.edges ?? []) {
        for (const end of ['source', 'target'] as const) {
          if (!exists(e[end])) problems.push(`data.added.edges "${e.id}": unknown ${end} "${String(e[end])}"`);
        }
      }
    }
  }
  if (step.settings !== undefined) {
    for (const v of findSerialisationViolations(step.settings, 'settings')) problems.push(v);
  }

  const view = step.view;
  if (view) {
    const added = new Set<string>();
    for (const n of step.data?.added?.nodes ?? []) added.add(n.id);
    for (const e of step.data?.added?.edges ?? []) added.add(e.id);
    const removed = new Set<string>([...(step.data?.removed?.nodeIds ?? []), ...(step.data?.removed?.edgeIds ?? [])]);
    const sources = canvas.layers
      .list()
      .map((l) => log.source(l.id))
      .filter((s) => s?.hasElement !== undefined);
    const known = (id: string): boolean =>
      added.has(id) || (!removed.has(id) && sources.some((s) => s!.hasElement!(id)));
    const check = (where: string, ids: readonly string[] | undefined): void => {
      for (const id of ids ?? []) if (!known(id)) problems.push(`${where}: unknown id "${id}"`);
    };
    check('view.select', view.select);
    if (view.focus) check('view.focus', view.focus.ids);
    if (typeof view.inspect === 'string') check('view.inspect', [view.inspect]);
    if (view.camera !== undefined && !CAMERA_INTENTS.has(view.camera)) {
      problems.push(`view.camera: "${String(view.camera)}" is not 'focus', 'visible' or 'all'`);
    }
  }

  for (const verb of step.do ?? []) {
    if (!canvas.commands.has(verb.command)) problems.push(`do: unknown command "${verb.command}"`);
  }
  return problems;
}

/**
 * The {@link PlaybookEnv} a `Canvas` plays steps through: its ordinary methods
 * — the source's `applyDelta`, `canvas.update`, the view-store actions, the
 * command registry, and the engine's settle signal.
 */
export function canvasPlaybookEnv(
  canvas: Canvas,
  log: OperationLog,
  whenSettled: () => Promise<void>,
): PlaybookEnv<CanvasConfig> {
  return {
    validate: (step, source) => validateStepSpec(canvas, log, step, source),
    apply(step, source) {
      const actor = step.actor ?? canvas.actor;
      if (step.data && source !== undefined) log.source(source)?.applyDelta?.(step.data, { actor });
      if (step.settings !== undefined) canvas.update(step.settings, PLAYBOOK_SETTINGS_ACTION);
      const view = step.view;
      if (!view) return;
      const actions = canvas.store.actions;
      if (view.select !== undefined) actions.selection.set(view.select);
      if (view.focus !== undefined) {
        if (view.focus === null) actions.focus.clear();
        else actions.focus.set(view.focus.ids, view.focus.dim ?? true);
      }
      if (view.inspect !== undefined) {
        if (view.inspect === null) actions.inspect.clear();
        else actions.inspect.set(view.inspect);
      }
      // Last, so the framing owner sees the focus / data it frames.
      if (view.camera !== undefined) actions.cameraIntent.request(view.camera);
    },
    runCommand: (name, args) =>
      canvas.commands.runAsync(name as never, args as never),
    whenSettled,
    actor: () => canvas.actor,
  };
}
