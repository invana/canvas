import type {
  ControlChoiceOption,
  ControlItemSpec,
  ControlPanelAnchor,
  ControlPanelInsets,
  ControlPanelSpec,
} from '@invana/canvas';

import {
  NO_ICON,
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

/** Map one item spec to its flat form row. */
export function itemToForm(item: ControlItemSpec): ControlItemFields {
  const row = { ...emptyItemFields(item.type), key: item.key ?? '' };
  switch (item.type) {
    case 'command':
      return {
        ...row,
        command: item.command,
        argsJson: toJson(item.args),
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
        argsJson: toJson(item.args),
        label: item.label,
        icon: item.icon ?? NO_ICON,
        activeIcon: item.activeIcon ?? NO_ICON,
        activeLabel: item.activeLabel ?? '',
      };
    case 'choice':
      return {
        ...row,
        command: item.command,
        argsJson: toJson(item.args),
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

/** Map a panel spec to form state. */
export function panelToForm(spec: ControlPanelSpec): ControlPanelFormState {
  const position = spec.position ?? 'top-left';
  const insets: ControlPanelInsets = typeof position === 'string' ? {} : position;
  const offset = spec.offset ?? 8;
  const panel: ControlPanelFields = {
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
    surface: spec.surface ?? true,
    visible: spec.visible ?? true,
  };
  return { panel, items: spec.items.map(itemToForm) };
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

const icon = (v: string): string | undefined => (v && v !== NO_ICON ? v : undefined);
const opt = (v: string): string | undefined => (v.trim() === '' ? undefined : v);

/**
 * Map one form row back to an item spec. A slot's name has no field but rides
 * along in the row (react-hook-form keeps unregistered values), so a
 * round-trip — or a reorder — never drops it.
 */
export function formToItem(row: ControlItemFields, index: number, errors: ControlPanelFormError[]): ControlItemSpec {
  const key = opt(row.key);
  const base = key ? { key } : {};
  const args = (field: string) => parseJson(row.argsJson, { item: index, field }, errors);
  switch (row.type) {
    case 'command': {
      const a = args('argsJson');
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
      const a = args('argsJson');
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
      const a = args('argsJson');
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
export function formToPanel(state: ControlPanelFormState): { spec: ControlPanelSpec; errors: ControlPanelFormError[] } {
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
  const spec: ControlPanelSpec = {
    kind: 'control-panel',
    position,
    ...(p.positionMode === 'anchor' && !(ox === 8 && oy === 8) ? { offset: ox === oy ? ox : { x: ox, y: oy } } : {}),
    ...(p.orientation !== 'auto' ? { orientation: p.orientation } : {}),
    ...(p.stretch ? { stretch: true } : {}),
    ...(p.surface ? {} : { surface: false }),
    ...(p.visible ? {} : { visible: false }),
    items: state.items.map((row, i) => formToItem(row, i, errors)),
  };
  return { spec, errors };
}

/** A fresh, empty panel — top-left, visible, no items. */
export function newPanelSpec(): ControlPanelSpec {
  return { kind: 'control-panel', position: 'top-left', items: [] };
}
