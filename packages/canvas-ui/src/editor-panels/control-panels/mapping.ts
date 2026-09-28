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
  type ChoiceOptionFields,
  type CommandArgDescriptors,
  type ControlItemFields,
  type ControlPanelFields,
  type ControlPanelFormError,
  type ControlPanelFormState,
  type WidgetOptionDescriptors,
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
    choiceOptions: [],
    widget: '',
    widgetOptions: {},
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
 * Split a described bag (a command's `args`, a widget's `options`) into the
 * described keys' form values and the rest as JSON text. With no descriptor
 * every key is "the rest".
 */
function describedToForm(
  bag: unknown,
  described: Readonly<Record<string, CommandArgSpec>> | undefined,
): { values: Record<string, ArgFieldValue>; json: string } {
  if (!described) return { values: {}, json: toJson(bag) };
  const obj = bag && typeof bag === 'object' && !Array.isArray(bag) ? (bag as Record<string, unknown>) : {};
  const values: Record<string, ArgFieldValue> = {};
  for (const [key, spec] of Object.entries(described)) values[key] = argToForm(spec, obj[key]);
  const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => !(k in described)));
  // A non-object bag (unusual) has no keys to describe: keep it whole as JSON.
  const json = bag !== undefined && obj !== bag ? toJson(bag) : Object.keys(rest).length > 0 ? toJson(rest) : '';
  return { values, json };
}

/** A command's `args` → the row's `args` + `argsJson` (see {@link describedToForm}). */
function argsToForm(args: unknown, described: Readonly<Record<string, CommandArgSpec>> | undefined): Pick<ControlItemFields, 'args' | 'argsJson'> {
  const { values, json } = describedToForm(args, described);
  return { args: values, argsJson: json };
}

/** A choice's static options → rows. */
function choiceOptionsToForm(options: readonly ControlChoiceOption[] | undefined): ChoiceOptionFields[] {
  return (options ?? []).map((o) => ({ value: o.value, label: o.label, icon: o.icon ?? NO_ICON }));
}

/**
 * Map one item spec to its flat form row. `descriptors` (the commands'
 * `CanvasCommand.args`) turn a command's described args into fields; the rest
 * stay JSON.
 */
export function itemToForm(
  item: ControlItemSpec,
  descriptors?: CommandArgDescriptors,
  widgetDescriptors?: WidgetOptionDescriptors,
): ControlItemFields {
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
        choiceOptions: choiceOptionsToForm(item.options),
      };
    case 'widget': {
      const { values, json } = describedToForm(item.options, widgetDescriptors?.[item.widget]);
      return { ...row, widget: item.widget, widgetOptions: values, widgetOptionsJson: json };
    }
    case 'text':
      return { ...row, text: item.text };
    case 'slot':
      return { ...row, slot: item.slot };
    default:
      return row;
  }
}

/** Map a panel spec to form state (see {@link itemToForm} for the descriptors). */
export function panelToForm(
  spec: ControlPanelSpec,
  descriptors?: CommandArgDescriptors,
  widgetDescriptors?: WidgetOptionDescriptors,
): ControlPanelFormState {
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
  return { panel, items: spec.items.map((item) => itemToForm(item, descriptors, widgetDescriptors)) };
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
 * A described bag back to one value: the described keys' fields (named
 * `<prefix>.<key>` in errors), over the JSON rest (`jsonField`). With no
 * descriptor, the JSON text is the whole bag.
 */
function describedFromForm(
  values: Record<string, ArgFieldValue> | undefined,
  json: string,
  described: Readonly<Record<string, CommandArgSpec>> | undefined,
  names: { prefix: string; jsonField: string },
  index: number,
  errors: ControlPanelFormError[],
): unknown {
  const rest = parseJson(json, { item: index, field: names.jsonField }, errors);
  if (!described) return rest;
  const out: Record<string, unknown> = rest && typeof rest === 'object' && !Array.isArray(rest) ? { ...rest } : {};
  for (const [key, spec] of Object.entries(described)) {
    const v = argFromForm(spec, values?.[key], { item: index, field: `${names.prefix}.${key}` }, errors);
    if (v !== undefined) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Choice rows back to options; rows without a value are dropped, none → `undefined` (the command's own). */
function choiceOptionsFromForm(rows: readonly ChoiceOptionFields[] | undefined): ControlChoiceOption[] | undefined {
  const options = (rows ?? [])
    .filter((r) => r.value.trim() !== '')
    .map((r) => ({ value: r.value, label: r.label.trim() === '' ? r.value : r.label, ...(icon(r.icon) ? { icon: r.icon } : {}) }));
  return options.length > 0 ? options : undefined;
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
  widgetDescriptors?: WidgetOptionDescriptors,
): ControlItemSpec {
  const key = opt(row.key);
  const base = key ? { key } : {};
  const args = () =>
    describedFromForm(row.args, row.argsJson, descriptors?.[row.command], { prefix: 'args', jsonField: 'argsJson' }, index, errors);
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
      const options = choiceOptionsFromForm(row.choiceOptions);
      return {
        type: 'choice',
        ...base,
        command: row.command,
        ...(a !== undefined ? { args: a as Record<string, unknown> } : {}),
        label: row.label,
        ...(options !== undefined ? { options } : {}),
        ...(row.display === 'segmented' ? { display: 'segmented' as const } : {}),
      };
    }
    case 'widget': {
      const options = describedFromForm(
        row.widgetOptions,
        row.widgetOptionsJson,
        widgetDescriptors?.[row.widget],
        { prefix: 'widgetOptions', jsonField: 'widgetOptionsJson' },
        index,
        errors,
      );
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
  widgetDescriptors?: WidgetOptionDescriptors,
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
  const items = state.items.map((row, i) => formToItem(row, i, errors, descriptors, widgetDescriptors));
  if (p.placement && p.placement !== 'canvas') {
    // A header / footer panel: no position, offset, flow or stretch — they don't apply there.
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
