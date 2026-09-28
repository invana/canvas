import type { CommandArgSpec } from '@invana/canvas';
import type { FieldConfig } from '@invana/forms';

import { ARG_DEFAULT, NO_ICON, type ArgFieldValue, type CommandArgDescriptors, type ControlItemFields, type WidgetOptionDescriptors } from './types';

/** The nine anchors, in reading order. */
const ANCHORS = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];

/** Where a panel can be drawn. */
const PLACEMENTS = [
  { label: 'Over the canvas', value: 'canvas' },
  { label: 'Header · left', value: 'header-left' },
  { label: 'Header · centre', value: 'header-center' },
  { label: 'Header · right', value: 'header-right' },
  { label: 'Footer · left', value: 'footer-left' },
  { label: 'Footer · centre', value: 'footer-center' },
  { label: 'Footer · right', value: 'footer-right' },
];

/**
 * Panel-level fields: placement, position (anchor or insets), offset, flow and
 * chrome. A function of the current values so only the fields that apply show
 * — a header- or footer-placed panel has no position, offset, flow or stretch.
 */
export function controlPanelFields(positionMode: string, placement = 'canvas'): FieldConfig[] {
  const placementField: FieldConfig = { name: 'placement', type: 'select', label: 'Placement', options: PLACEMENTS };
  if (placement !== 'canvas') {
    return [
      placementField,
      { name: 'surface', type: 'boolean', label: 'Card surface', control: 'checkbox' },
      { name: 'visible', type: 'boolean', label: 'Visible', control: 'checkbox' },
    ];
  }
  const position: FieldConfig[] =
    positionMode === 'insets'
      ? [
          { name: 'insetTop', type: 'text', label: 'Top', placeholder: 'e.g. 12 or 10%' },
          { name: 'insetRight', type: 'text', label: 'Right' },
          { name: 'insetBottom', type: 'text', label: 'Bottom' },
          { name: 'insetLeft', type: 'text', label: 'Left' },
        ]
      : [
          { name: 'anchor', type: 'select', label: 'Anchor', options: ANCHORS.map((a) => ({ label: a, value: a })) },
          { name: 'offsetX', type: 'number', label: 'Offset X', min: 0, step: 1 },
          { name: 'offsetY', type: 'number', label: 'Offset Y', min: 0, step: 1 },
        ];
  return [
    placementField,
    {
      name: 'positionMode',
      type: 'select',
      label: 'Position',
      options: [
        { label: 'Anchor', value: 'anchor' },
        { label: 'Insets', value: 'insets' },
      ],
    },
    ...position,
    {
      name: 'orientation',
      type: 'select',
      label: 'Flow',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Row', value: 'horizontal' },
        { label: 'Column', value: 'vertical' },
      ],
    },
    { name: 'stretch', type: 'boolean', label: 'Stretch along the edge', control: 'checkbox' },
    { name: 'surface', type: 'boolean', label: 'Card surface', control: 'checkbox' },
    { name: 'visible', type: 'boolean', label: 'Visible', control: 'checkbox' },
  ];
}

/** The item kinds, as a select. */
export const ITEM_TYPE_OPTIONS: { label: string; value: ControlItemFields['type'] }[] = [
  { label: 'Button', value: 'command' },
  { label: 'Toggle', value: 'toggle' },
  { label: 'Picker', value: 'choice' },
  { label: 'Widget', value: 'widget' },
  { label: 'Text', value: 'text' },
  { label: 'Divider', value: 'divider' },
  { label: 'Slot (runtime)', value: 'slot' },
];

/** What the item-row pickers can offer — the live registries. */
export interface ControlItemChoices {
  /** Registered command names. */
  commands: readonly string[];
  /** Icon registry names. */
  icons: readonly string[];
  /** Widget registry names. */
  widgets: readonly string[];
  /** Each widget's options descriptor (`ControlWidget.optionsSpec`), by name — a field per described key. */
  widgetOptions?: WidgetOptionDescriptors;
  /** Each command's argument descriptor (`CanvasCommand.args`), by name — a field per described key. */
  commandArgs?: CommandArgDescriptors;
  /** Registered layer ids, for `layer` arguments. */
  layers?: readonly string[];
  /** Registered behaviour ids, for `behaviour` arguments. */
  behaviours?: readonly string[];
  /** Registered layout ids, for `layout` arguments. */
  layouts?: readonly string[];
}

/** `select` options for `names`, keeping `current` (flagged) when it isn't one of them. */
function namesOptions(names: readonly string[], current: string, missing: string): { label: string; value: string }[] {
  const options = names.map((n) => ({ label: n, value: n }));
  return current && !names.includes(current) ? [{ label: `${current} (${missing})`, value: current }, ...options] : options;
}

/** An icon `select` with a "(none)" entry. */
export function iconField(name: string, label: string, icons: readonly string[], current: string): FieldConfig {
  const known = current && current !== NO_ICON ? namesOptions(icons, current, 'not registered') : icons.map((n) => ({ label: n, value: n }));
  return { name, type: 'select', label, options: [{ label: '(none)', value: NO_ICON }, ...known] };
}

/** A described argument's default, as the hint a field shows. */
function defaultHint(spec: CommandArgSpec): string | undefined {
  if (spec.default === undefined) return undefined;
  return Array.isArray(spec.default) ? spec.default.join(', ') : typeof spec.default === 'object' ? JSON.stringify(spec.default) : String(spec.default);
}

/**
 * One field per key `described` names, each named `<prefix>.<key>` — a
 * command's `args` or a widget's `options`, whose current form values are
 * `values`. A `pick` key is left out when `skipPick` (a `choice` item — picking
 * supplies it). Ids the registries don't hold stay selectable, flagged, like
 * command names.
 */
function describedFields(
  described: Readonly<Record<string, CommandArgSpec>>,
  prefix: string,
  values: Record<string, ArgFieldValue> | undefined,
  choices: ControlItemChoices,
  skipPick = false,
): FieldConfig[] {
  const refs: Partial<Record<CommandArgSpec['kind'], readonly string[]>> = {
    layer: choices.layers ?? [],
    behaviour: choices.behaviours ?? [],
    layout: choices.layouts ?? [],
  };
  const fields: FieldConfig[] = [];
  for (const [key, spec] of Object.entries(described)) {
    if (spec.pick && skipPick) continue;
    const hint = defaultHint(spec);
    const base = {
      name: `${prefix}.${key}`,
      label: spec.label ?? key,
      ...(spec.description ? { description: spec.description } : {}),
    };
    const unset = { label: hint !== undefined ? `(default: ${hint})` : '(not set)', value: ARG_DEFAULT };
    const current = values?.[key];
    const currentText = typeof current === 'string' && current !== ARG_DEFAULT ? current : '';
    switch (spec.kind) {
      case 'number':
        fields.push({ ...base, type: 'number', ...(hint !== undefined ? { placeholder: hint } : {}) });
        break;
      case 'boolean':
        fields.push({ ...base, type: 'select', options: [unset, { label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] });
        break;
      case 'enum':
        fields.push({ ...base, type: 'select', options: [unset, ...(spec.options ?? []).map((o) => ({ label: o.label, value: o.value }))] });
        break;
      case 'layer':
      case 'behaviour':
      case 'layout':
        fields.push({ ...base, type: 'select', options: [unset, ...namesOptions(refs[spec.kind] ?? [], currentText, 'not registered')] });
        break;
      case 'json':
        fields.push({ ...base, type: 'textarea', rows: 2, colSpan: 2, ...(hint !== undefined ? { placeholder: hint } : {}) });
        break;
      case 'strings':
        fields.push({ ...base, type: 'text', placeholder: hint ?? 'a, b, c' });
        break;
      default:
        fields.push({ ...base, type: 'text', ...(hint !== undefined ? { placeholder: hint } : {}) });
    }
  }
  return fields;
}

/**
 * The fields one item row shows, by its `type` — with the command / icon /
 * widget selects filled from the live registries. A name that isn't
 * registered (a panel saved on a richer canvas) stays selectable, flagged,
 * so editing never drops it.
 */
export function controlItemFields(row: ControlItemFields, choices: ControlItemChoices): FieldConfig[] {
  const typeField: FieldConfig = { name: 'type', type: 'select', label: 'Kind', options: ITEM_TYPE_OPTIONS };
  const keyField: FieldConfig = { name: 'key', type: 'text', label: 'Key', placeholder: 'optional' };
  const commandField: FieldConfig = {
    name: 'command',
    type: 'select',
    label: 'Command',
    options: namesOptions(choices.commands, row.command, 'not registered'),
  };
  // Described args get a field each; whatever the descriptor doesn't name — or
  // everything, for an undescribed command — stays JSON.
  const described = choices.commandArgs?.[row.command];
  const argsFields: FieldConfig[] = [
    ...(described ? describedFields(described, 'args', row.args, choices, row.type === 'choice') : []),
    {
      name: 'argsJson',
      type: 'textarea',
      label: described ? 'More args (JSON)' : 'Args (JSON)',
      rows: 2,
      colSpan: 2,
      placeholder: '{ }',
    },
  ];

  switch (row.type) {
    case 'command':
      return [
        typeField,
        keyField,
        commandField,
        { name: 'label', type: 'text', label: 'Label' },
        iconField('icon', 'Icon', choices.icons, row.icon),
        { name: 'text', type: 'text', label: 'Text', placeholder: 'optional' },
        iconField('activeIcon', 'Icon while active', choices.icons, row.activeIcon),
        { name: 'activeLabel', type: 'text', label: 'Label while active' },
        { name: 'activeText', type: 'text', label: 'Text while active' },
        ...argsFields,
      ];
    case 'toggle':
      return [
        typeField,
        keyField,
        commandField,
        { name: 'label', type: 'text', label: 'Label' },
        iconField('icon', 'Icon', choices.icons, row.icon),
        iconField('activeIcon', 'Icon while on', choices.icons, row.activeIcon),
        { name: 'activeLabel', type: 'text', label: 'Label while on' },
        ...argsFields,
      ];
    case 'choice':
      return [
        typeField,
        keyField,
        commandField,
        { name: 'label', type: 'text', label: 'Label' },
        {
          name: 'display',
          type: 'select',
          label: 'Display',
          options: [
            { label: 'Dropdown', value: 'dropdown' },
            { label: 'Segmented', value: 'segmented' },
          ],
        },
        ...argsFields,
        // The static options are rows — `ChoiceOptionsField`, below these fields.
      ];
    case 'widget': {
      // Like a command's args: a field per key the widget's `optionsSpec`
      // describes, the rest (or everything, for an undescribed widget) as JSON.
      const optionsSpec = choices.widgetOptions?.[row.widget];
      return [
        typeField,
        keyField,
        { name: 'widget', type: 'select', label: 'Widget', options: namesOptions(choices.widgets, row.widget, 'not registered') },
        ...(optionsSpec ? describedFields(optionsSpec, 'widgetOptions', row.widgetOptions, choices) : []),
        {
          name: 'widgetOptionsJson',
          type: 'textarea',
          label: optionsSpec ? 'More options (JSON)' : 'Options (JSON)',
          rows: 2,
          colSpan: 2,
          placeholder: '{ }',
        },
      ];
    }
    case 'text':
      return [typeField, keyField, { name: 'text', type: 'text', label: 'Text' }];
    case 'divider':
      return [typeField, keyField];
    case 'slot':
      // Runtime React content registered by `<ControlPanel>` children: shown, not editable.
      return [keyField];
    default:
      return [typeField];
  }
}
