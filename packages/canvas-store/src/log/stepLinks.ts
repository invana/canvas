import type { OperationLog } from '@invana/canvas-core';

/**
 * What a `sinceLastStep` result summarised: the applied entries it covers, so
 * `Playbook.addStep` can adopt them as the step instead of playing it again.
 */
export interface StepLink {
  /** The log the entries live in — a link is only honoured by a playbook on the same log. */
  log: OperationLog;
  /** The newest applied entry before the covered range (`null` = the log's start). */
  before: string | null;
  /** The covered entries, oldest first (non-empty). */
  entryIds: string[];
}

/**
 * `sinceLastStep` result → the entries it covers. Keyed by the returned
 * object, so a JSON copy of it is an ordinary step (it plays afresh). Internal
 * to `@invana/canvas-store`: `historyView` writes it, `createPlaybook` reads it.
 */
export const stepLinks = new WeakMap<object, StepLink>();
