import type { KeyboardShortcutBindingOption, KeyboardShortcutsFields, KeyboardShortcutsOptions } from './types';

/** The arrow a binding line uses between its keys and its command (`->` and `=>` are read too). */
const ARROW = '→';
const ARROW_PATTERN = /\s*(?:→|->|=>)\s*/;

/** One binding as a line: `keys → command`, plus its args as JSON when it has any. */
export function bindingToLine(b: KeyboardShortcutBindingOption): string {
  const args = b.args === undefined ? '' : ` ${JSON.stringify(b.args)}`;
  return `${b.keys} ${ARROW} ${b.command}${args}`;
}

/**
 * Parse one line back to a binding, or `null` for a blank / `#` comment line or
 * one that doesn't parse (no arrow, no command, args that aren't JSON).
 */
export function lineToBinding(line: string): KeyboardShortcutBindingOption | null {
  const t = line.trim();
  if (t === '' || t.startsWith('#')) return null;
  const parts = t.split(ARROW_PATTERN);
  if (parts.length < 2) return null;
  const keys = parts[0]!.trim();
  const rhs = parts.slice(1).join(' ').trim();
  const space = rhs.search(/\s/);
  const command = space < 0 ? rhs : rhs.slice(0, space);
  const argsText = space < 0 ? '' : rhs.slice(space).trim();
  if (!keys || !command) return null;
  if (argsText === '') return { keys, command };
  try {
    return { keys, command, args: JSON.parse(argsText) as unknown };
  } catch {
    return null;
  }
}

/** Options → flat fields: the bindings become one line each. */
export function optionsToForm(o: KeyboardShortcutsOptions = {}): KeyboardShortcutsFields {
  return {
    scope: o.scope ?? 'canvas',
    bindingsText: (o.bindings ?? []).map(bindingToLine).join('\n'),
  };
}

/**
 * Flat fields → an options patch. Lines that don't parse are dropped — check
 * them with {@link lineToBinding} to report them first (the editor panel does).
 */
export function formToOptions(f: KeyboardShortcutsFields): KeyboardShortcutsOptions {
  const out: KeyboardShortcutsOptions = {};
  if (f.scope !== undefined) out.scope = f.scope;
  if (f.bindingsText !== undefined) {
    out.bindings = f.bindingsText
      .split('\n')
      .map(lineToBinding)
      .filter((b): b is KeyboardShortcutBindingOption => b !== null);
  }
  return out;
}

/** The 1-based numbers of lines that aren't blank, comments, or valid bindings. */
export function invalidBindingLines(text: string): number[] {
  const bad: number[] = [];
  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t !== '' && !t.startsWith('#') && lineToBinding(line) === null) bad.push(i + 1);
  });
  return bad;
}
