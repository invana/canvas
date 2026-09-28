import type { CommandName, ControlItemSpec } from '@invana/canvas';
import type { GraphCanvasCommandMap } from '@invana/graph';

/**
 * A command name a control spec may name: every engine and graph command
 * (offered for completion), or any other string — an app's own commands, or a
 * name registered by a provider. Persisted specs keep plain `string`.
 */
export type ControlCommandName = CommandName<GraphCanvasCommandMap>;

/** `T` with its `command` field (when it has one) typed as {@link ControlCommandName}. */
type WithCommandName<T> = T extends { command: string } ? Omit<T, 'command'> & { command: ControlCommandName } : T;

/**
 * A {@link ControlItemSpec} as an author writes it: the same JSON, with the
 * `command` field completing the known command names.
 */
export type AuthoredControlItemSpec = WithCommandName<ControlItemSpec>;

/**
 * Identity helper for authoring control specs in code — `defineControlItems([…])`
 * gives the `command` fields name completion (engine + graph commands) without
 * narrowing what's accepted. Returns the items unchanged, typed as the
 * persisted `ControlItemSpec[]`.
 */
export function defineControlItems(items: readonly AuthoredControlItemSpec[]): readonly ControlItemSpec[] {
  return items as readonly ControlItemSpec[];
}
