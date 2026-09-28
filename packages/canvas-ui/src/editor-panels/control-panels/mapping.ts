import type {
  CommandArgSpec,
  ControlChoiceOption,
  ControlItemSpec,
  ControlPanelAnchor,
  ControlPanelInsets,
  ControlPanelSpec,
} from '@invana/canvas';

import {
  ARG_DEFAULT,
  NO_ICON,
  type ArgFieldValue,
  type CommandArgDescriptors,
  type ControlItemFields,
  type ControlPanelFields,
  type ControlPanelFormError,
  type ControlPanelFormState,
} from './types';

/** A blank row of the given kind. */
export function emptyItemFields(type: ControlItemFields['type'] = 'command'): ControlItemFields {
  return {
    type,
    key: '',
    command: '',
    args: {},
    argsJson: '',
    label: '',
    activeLabel: '',
    text: '',
    activeText: '',
    icon: NO_ICON,
    activeIcon: NO_ICON,
    display: 'dropdown',
    choiceOptionsJson: '',
    widget: '',
    widgetOptionsJson: '',
    slot: '',
  };
}

/** JSON → pretty text for a textarea; `undefined` → empty. */
const toJson = (v: unknown): string => (v === undefined ? '' : JSON.stringify(v, null, 1));

/** An inset as text (numbers keep their px meaning on the way back). */
const insetText = (v: number | string | undefined): string => (v === undefined ? '' : String(v));

/** One described argument's value → its form value. */
function argToForm(spec: CommandArgSpec, value: unknown): ArgFieldValue {
  if (value === undefined) return spec.kind === 'number' ? undefined : SELECT_KINDS.has(spec.kind) ? ARG_DEFAULT : '';
  switch (spec.kind) {
    case 'number':
      return typeof value === 'number' ? value : Number(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'strings':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'json':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

/** Argument kinds edited with a select (so "not set" is the {@link ARG_DEFAULT} sentinel). */
const SELECT_KINDS = new Set<CommandArgSpec['kind']>(['enum', 'boolean', 'layer', 'behaviour', 'layout']);

/**
 * Split a command's `args` into the described keys' form values and the rest as
 * JSON text. With no descriptor every key is "the rest".
 */
function argsToForm(args: unknown, described: Readonly<Record<string, CommandArgSpec>> | undefined): Pick<ControlItemFields, 'args' | 'argsJson'> {
  if (!described) return { args: {}, argsJson: toJson(args) };
  const bag = args && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
  const out: Record<string, ArgFieldValue> = {};
  for (const [key, spec] of Object.entries(described)) out[key] = argToForm(spec, bag[key]);
  const rest = Object.fromEntries(Object.entries(bag).filter(([k]) => !(k in described)));
  // A non-object `args` (unusual) has no keys to describe: keep it whole as JSON.
  const restJson = args !== undefined && bag !== args ? toJson(args) : Object.keys(rest).length > 0 ? toJson(rest) : '';
  return { args: out, argsJson: restJson };
}

/**
 * Map one item spec to its flat form row. `descriptors` (the commands'
 * `CanvasCommand.args`) turn a command's described args into fields; the rest
 * stay JSON.
 */
export function itemToForm(item: ControlItemSpec, descriptors?: CommandArgDescriptors): ControlItemFields {
  const row = { ...emptyItemFields(item.type), key: item.key ?? '' };
  switch (item.type) {
    case 'command':
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        text: item.text ?? '',
        icon: item.icon ?? NO_ICON,
        activeIcon: item.activeIcon ?? NO_ICON,
        activeLabel: item.activeLabel ?? '',
        activeText: item.activeText ?? '',
      };
    case 'toggle':
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        icon: item.icon ?? NO_ICON,
        activeIcon: item.activeIcon ?? NO_ICON,
        activeLabel: item.activeLabel ?? '',
      };
    case 'choice':
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        display: item.display ?? 'dropdown',
        choiceOptionsJson: toJson(item.options),
      };
    case 'widget':
      return { ...row, widget: item.widget, widgetOptionsJson: toJson(item.options) };
    case 'text':
      return { ...row, text: item.text };
    case 'slot':
      return { ...row, slot: item.slot };
    default:
      return row;
  }
}

/** Map a panel spec to form state (see {@link itemToForm} for `descriptors`). */
export function panelToForm(spec: ControlPanelSpec, descriptors?: CommandArgDescriptors): ControlPanelFormState {
  const position = spec.position ?? 'top-left';
  const insets: ControlPanelInsets = typeof position === 'string' ? {} : position;
  const offset = spec.offset ?? 8;
  const placement = spec.placement ?? 'canvas';
  const panel: ControlPanelFields = {
    placement,
    positionMode: typeof position === 'string' ? 'anchor' : 'insets',
    anchor: typeof position === 'string' ? position : 'top-left',
    insetTop: insetText(insets.top),
    insetRight: insetText(insets.right),
    insetBottom: insetText(insets.bottom),
    insetLeft: insetText(insets.left),
    offsetX: typeof offset === 'number' ? offset : offset.x,
    offsetY: typeof offset === 'number' ? offset : offset.y,
    orientation: spec.orientation ?? 'auto',
    stretch: spec.stretch ?? false,
    // The card surface is on by default over the canvas, off in the header.
    surface: spec.surface ?? placement === 'canvas',
    visible: spec.visible ?? true,
  };
  return { panel, items: spec.items.map((item) => itemToForm(item, descriptors)) };
}

/** Parse a JSON textarea: empty → `undefined`; bad JSON → an error entry. */
function parseJson(
  text: string,
  where: { item: number | null; field: string },
  errors: ControlPanelFormError[],
): unknown {
  const t = text.trim();
  if (t === '') return undefined;
  try {
    return JSON.parse(t) as unknown;
  } catch (e) {
    errors.push({ ...where, message: e instanceof Error ? e.message : 'Invalid JSON' });
    return undefined;
  }
}

/** A text inset back to a number when it's numeric (px), else the CSS string; empty → unset. */
function insetValue(text: string): number | string | undefined {
  const t = text.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : t;
}

/** One described argument's form value → its JSON value; `undefined` = not set. */
function argFromForm(
  spec: CommandArgSpec,
  value: ArgFieldValue,
  where: { item: number; field: string },
  errors: ControlPanelFormError[],
): unknown {
  if (value === undefined || value === ARG_DEFAULT) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const t = value.trim();
  if (t === '') return undefined;
  switch (spec.kind) {
    case 'number': {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
      errors.push({ ...where, message: 'Not a number' });
      return undefined;
    }
    case 'boolean':
      return t === 'true';
    case 'strings':
      return t.split(',').map((x) => x.trim()).filter((x) => x !== '');
    case 'json':
      return parseJson(t, where, errors);
    default:
      return t;
  }
}

/**
 * A row's args back to one bag: the described keys' fields, over the JSON
 * rest. With no descriptor, the JSON text is the whole bag.
 */
function argsFromForm(
  row: ControlItemFields,
  described: Readonly<Record<string, CommandArgSpec>> | undefined,
  index: number,
  errors: ControlPanelFormError[],
): unknown {
  const rest = parseJson(row.argsJson, { item: index, field: 'argsJson' }, errors);
  if (!described) return rest;
  const out: Record<string, unknown> = rest && typeof rest === 'object' && !Array.isArray(rest) ? { ...rest } : {};
  for (const [key, spec] of Object.entries(described)) {
    const v = argFromForm(spec, row.args?.[key], { item: index, field: `args.${key}` }, errors);
    if (v !== undefined) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const icon = (v: string): string | undefined => (v && v !== NO_ICON ? v : undefined);
const opt = (v: string): string | undefined => (v.trim() === '' ? undefined : v);

/**
 * Map one form row back to an item spec. A slot's name has no field but rides
 * along in the row (react-hook-form keeps unregistered values), so a
 * round-trip — or a reorder — never drops it.
 */
export function formToItem(
  row: ControlItemFields,
  index: number,
  errors: ControlPanelFormError[],
  descriptors?: CommandArgDescriptors,
): ControlItemSpec {
  const key = opt(row.key);
  const base = key ? { key } : {};
  const args = () => argsFromForm(row, descriptors?.[row.command], index, errors);
  switch (row.type) {
    case 'command': {
      const a = args();
      return {
        type: 'command',
        ...base,
        command: row.command,
        ...(a !== undefined ? { args: a } : {}),
        label: row.label,
        ...(opt(row.text) ? { text: row.text } : {}),
        ...(icon(row.icon) ? { icon: row.icon } : {}),
        ...(icon(row.activeIcon) ? { activeIcon: row.activeIcon } : {}),
        ...(opt(row.activeLabel) ? { activeLabel: row.activeLabel } : {}),
        ...(opt(row.activeText) ? { activeText: row.activeText } : {}),
      };
    }
    case 'toggle': {
      const a = args();
      return {
        type: 'toggle',
        ...base,
        command: row.command,
        ...(a !== undefined ? { args: a } : {}),
        label: row.label,
        ...(icon(row.icon) ? { icon: row.icon } : {}),
        ...(icon(row.activeIcon) ? { activeIcon: row.activeIcon } : {}),
        ...(opt(row.activeLabel) ? { activeLabel: row.activeLabel } : {}),
      };
    }
    case 'choice': {
      const a = args();
      const options = parseJson(row.choiceOptionsJson, { item: index, field: 'choiceOptionsJson' }, errors);
      return {
        type: 'choice',
        ...base,
        command: row.command,
        ...(a !== undefined ? { args: a as Record<string, unknown> } : {}),
        label: row.label,
        ...(options !== undefined ? { options: options as ControlChoiceOption[] } : {}),
        ...(row.display === 'segmented' ? { display: 'segmented' as const } : {}),
      };
    }
    case 'widget': {
      const options = parseJson(row.widgetOptionsJson, { item: index, field: 'widgetOptionsJson' }, errors);
      return {
        type: 'widget',
        ...base,
        widget: row.widget,
        ...(options !== undefined ? { options: options as Record<string, unknown> } : {}),
      };
    }
    case 'text':
      return { type: 'text', ...base, text: row.text };
    case 'slot':
      return { type: 'slot', ...base, slot: row.slot };
    case 'divider':
    default:
      return { type: 'divider', ...base };
  }
}

/**
 * Map form state back to a panel spec, collecting JSON errors instead of
 * throwing. The caller submits only when `errors` stays empty.
 */
export function formToPanel(
  state: ControlPanelFormState,
  descriptors?: CommandArgDescriptors,
): { spec: ControlPanelSpec; errors: ControlPanelFormError[] } {
  const errors: ControlPanelFormError[] = [];
  const p = state.panel;
  const position =
    p.positionMode === 'insets'
      ? Object.fromEntries(
          (['top', 'right', 'bottom', 'left'] as const)
            .map((side) => [side, insetValue(p[`inset${side[0]!.toUpperCase()}${side.slice(1)}` as keyof ControlPanelFields] as string)])
            .filter(([, v]) => v !== undefined),
        )
      : (p.anchor as ControlPanelAnchor);
  const ox = p.offsetX ?? 8;
  const oy = p.offsetY ?? 8;
  const items = state.items.map((row, i) => formToItem(row, i, errors, descriptors));
  if (p.placement && p.placement !== 'canvas') {
    // A header panel: no position, offset, flow or stretch — they don't apply there.
    return {
      spec: {
        kind: 'control-panel',
        placement: p.placement,
        ...(p.surface ? { surface: true } : {}),
        ...(p.visible ? {} : { visible: false }),
        items,
      },
      errors,
    };
  }
  const spec: ControlPanelSpec = {
    kind: 'control-panel',
    position,
    ...(p.positionMode === 'anchor' && !(ox === 8 && oy === 8) ? { offset: ox === oy ? ox : { x: ox, y: oy } } : {}),
    ...(p.orientation !== 'auto' ? { orientation: p.orientation } : {}),
    ...(p.stretch ? { stretch: true } : {}),
    ...(p.surface ? {} : { surface: false }),
    ...(p.visible ? {} : { visible: false }),
    items,
  };
  return { spec, errors };
}

/** A fresh, empty panel — top-left, visible, no items. */
export function newPanelSpec(): ControlPanelSpec {
  return { kind: 'control-panel', position: 'top-left', items: [] };
}
