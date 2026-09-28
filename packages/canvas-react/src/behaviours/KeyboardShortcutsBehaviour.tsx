import * as canvas from '@invana/canvas';
import { type KeyboardShortcutsBehaviourOptions } from '@invana/canvas';

import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface KeyboardShortcutsBehaviourProps extends Omit<KeyboardShortcutsBehaviourOptions, 'id'> {
  /** Behaviour id; default `'keyboard-shortcuts'`. Changing this remounts the behaviour. */
  id?: string;
}

/**
 * Declarative wrapper for `@invana/canvas` `KeyboardShortcutsBehaviour` — key
 * bindings that run commands. Nothing is bound unless you pass `bindings`
 * (`DEFAULT_SHORTCUTS` holds the usual editor keys).
 *
 * `enabled` is reactive; `bindings` / `scope` are init-only here — change `id` /
 * `key`, or edit them live through `canvas.update({ behaviours: { [id]: { bindings } } })`.
 */
export function KeyboardShortcutsBehaviour({ id = 'keyboard-shortcuts', enabled = true, ...rest }: KeyboardShortcutsBehaviourProps) {
  useBehaviourRegistration(() => new canvas.KeyboardShortcutsBehaviour({ id, enabled, ...rest }), id, enabled, [id]);
  return null;
}
