/**
 * The selection-mode rule, shared by the `select.mode` command
 * (`graphCommands.ts`) and `canvas-react`'s `useSelectMode` hook, so a toolbar
 * picker and a saved control panel can never disagree about which mode is on.
 *
 * A **modes map** is `mode key → behaviour id`, e.g.
 * `{ click: '', brush: 'brush-select', lasso: 'lasso-select' }`. An empty id
 * means the mode needs no behaviour of its own (click select is always on);
 * every non-empty id is a behaviour the switch enables / disables exclusively.
 */

/**
 * The currently-active selection mode.
 *
 * Resolution order:
 * 1. the first mode (in key order) whose **non-empty** behaviour id is enabled;
 * 2. else the first mode whose id is `''` (the behaviour-less mode, e.g. `click`);
 * 3. else the first key;
 * 4. else `null` (an empty map).
 *
 * The caller supplies how "enabled" is read, so each keeps its own source: the
 * command reads the live behaviour (`canvas.behaviours.get(id)?.enabled`), the
 * React hook reads the reactive definition (`definition.behaviours[id].enabled`).
 * The two agree whenever writes go through `canvas.update`.
 *
 * @param modes     Mode key → behaviour id (`''` = no behaviour).
 * @param isEnabled Whether the behaviour with this id is currently enabled.
 * @returns The active mode key, or `null` when `modes` is empty.
 */
export function resolveSelectMode(
  modes: Record<string, string>,
  isEnabled: (behaviourId: string) => boolean,
): string | null {
  for (const [mode, id] of Object.entries(modes)) {
    if (id && isEnabled(id)) return mode;
  }
  const keys = Object.keys(modes);
  return keys.find((k) => !modes[k]) ?? keys[0] ?? null;
}

/**
 * The `canvas.update({ behaviours })` patch that switches to mode `next`:
 * `{ [id]: { enabled: mode === next } }` for every mode with a non-empty
 * behaviour id, so exactly `next`'s behaviour (if it has one) ends up enabled
 * and every other mode's behaviour disabled. Behaviour-less modes contribute
 * nothing — switching to one simply disables all the others.
 *
 * @param modes Mode key → behaviour id (`''` = no behaviour).
 * @param next  The mode key to switch to.
 */
export function selectModePatch(
  modes: Record<string, string>,
  next: string,
): Record<string, { enabled: boolean }> {
  const patch: Record<string, { enabled: boolean }> = {};
  for (const [mode, id] of Object.entries(modes)) {
    if (id) patch[id] = { enabled: mode === next };
  }
  return patch;
}
