import type { FieldConfig } from '@invana/forms';

import { NO_ICON, type ControlItemFields } from './types';

/** The nine anchors, in reading order. */
const ANCHORS = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];

/**
 * Panel-level fields: position (anchor or insets), offset, flow and chrome.
 * A function of the current values so only the active position mode's fields
 * show.
 */
export function controlPanelFields(positionMode: string): FieldConfig[] {
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
}

/** `select` options for `names`, keeping `current` (flagged) when it isn't one of them. */
function namesOptions(names: readonly string[], current: string, missing: string): { label: string; value: string }[] {
  const options = names.map((n) => ({ label: n, value: n }));
  return current && !names.includes(current) ? [{ label: `${current} (${missing})`, value: current }, ...options] : options;
}

/** An icon `select` with a "(none)" entry. */
function iconField(name: string, label: string, icons: readonly string[], current: string): FieldConfig {
  const known = current && current !== NO_ICON ? namesOptions(icons, current, 'not registered') : icons.map((n) => ({ label: n, value: n }));
  return { name, type: 'select', label, options: [{ label: '(none)', value: NO_ICON }, ...known] };
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
  const argsField: FieldConfig = { name: 'argsJson', type: 'textarea', label: 'Args (JSON)', rows: 2, colSpan: 2, placeholder: '{ }' };

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
        argsField,
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
        argsField,
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
        argsField,
        {
          name: 'choiceOptionsJson',
          type: 'textarea',
          label: 'Options (JSON)',
          rows: 2,
          colSpan: 2,
          placeholder: 'empty = the command’s own',
        },
      ];
    case 'widget':
      return [
        typeField,
        keyField,
        { name: 'widget', type: 'select', label: 'Widget', options: namesOptions(choices.widgets, row.widget, 'not registered') },
        { name: 'widgetOptionsJson', type: 'textarea', label: 'Options (JSON)', rows: 2, colSpan: 2, placeholder: '{ }' },
      ];
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
