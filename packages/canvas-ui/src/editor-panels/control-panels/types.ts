/**
 * Form shapes for the control-panel editor ({@link ControlPanelsEditorPanel}).
 *
 * The engine shape is `ControlPanelSpec` (`@invana/canvas`, types only): a
 * position, a few presentation flags and an `items` list whose entries are a
 * discriminated union. The form flattens both — a panel's position becomes an
 * anchor-or-insets pair of fields, and every item becomes one flat row whose
 * visible fields depend on its `type`. A command's `args` get one field per key
 * its `CanvasCommand.args` descriptor names (`args.<key>`); keys it doesn't name
 * — and every key of an undescribed command — stay JSON text (`argsJson`). A
 * widget's `options` work the same way over the widget's `optionsSpec`
 * (`widgetOptions.<key>` + `widgetOptionsJson`), and a choice's static `options`
 * are rows (`choiceOptions`). `mapping.ts` is the bridge both ways.
 */

import type { CommandArgSpec, ControlItemSpec, ControlPanelPlacement } from '@invana/canvas';

/** Each command's argument descriptor, by command name (`CanvasCommand.args`). */
export type CommandArgDescriptors = Readonly<Record<string, Readonly<Record<string, CommandArgSpec>>>>;

/** Each widget's options descriptor, by widget name (`ControlWidget.optionsSpec`). */
export type WidgetOptionDescriptors = Readonly<Record<string, Readonly<Record<string, CommandArgSpec>>>>;

/** One static option of a choice item, as a form row (`ControlChoiceOption`). */
export interface ChoiceOptionFields {
  value: string;
  label: string;
  /** Icon name, or {@link NO_ICON}. */
  icon: string;
}

/**
 * A described argument's form value: text for text-like kinds (a `strings` list
 * is comma-separated, `json` is JSON text), a number for `number`, and a select
 * value — {@link ARG_DEFAULT} for "not set" — for `enum` / `boolean` / the
 * registry-id kinds.
 */
export type ArgFieldValue = string | number | undefined;

/** How a panel is positioned: a 9-point anchor, or explicit CSS insets. */
export type PanelPositionMode = 'anchor' | 'insets';

/** Flat form fields for one panel's own settings (everything but `items`). */
export interface ControlPanelFields {
  /** Which surface draws the panel — `ControlPanelPlacement`. */
  placement: ControlPanelPlacement;
  positionMode: PanelPositionMode;
  /** One of the nine `ControlPanelAnchor`s (used when `positionMode` is `'anchor'`). */
  anchor: string;
  /** CSS insets (numbers as px, or any CSS length) — used when `positionMode` is `'insets'`. Empty = unset. */
  insetTop: string;
  insetRight: string;
  insetBottom: string;
  insetLeft: string;
  /** Gap from the anchored edge(s), px. */
  offsetX?: number;
  offsetY?: number;
  /** `'auto'` = the renderer's default for the anchor. */
  orientation: 'auto' | 'horizontal' | 'vertical';
  stretch: boolean;
  surface: boolean;
  visible: boolean;
}

/**
 * One item as a flat form row. Only the fields for its `type` are shown; the
 * rest stay empty and are dropped on the way back. Icon selects use
 * {@link NO_ICON} for "none" (the select chrome forbids an empty value).
 */
export interface ControlItemFields {
  type: ControlItemSpec['type'];
  key: string;
  command: string;
  /** Described args, one form value per key (see {@link ArgFieldValue}). */
  args: Record<string, ArgFieldValue>;
  /** The args the command's descriptor doesn't name — or all of them when it has none — as JSON text (empty = none). */
  argsJson: string;
  label: string;
  activeLabel: string;
  text: string;
  activeText: string;
  icon: string;
  activeIcon: string;
  /** Choice display — `'dropdown'` or `'segmented'`. */
  display: string;
  /** A choice's static `options`, one row each (none = the command's own). */
  choiceOptions: ChoiceOptionFields[];
  widget: string;
  /** Described widget options, one form value per key (see {@link ArgFieldValue}). */
  widgetOptions: Record<string, ArgFieldValue>;
  /** The options the widget's descriptor doesn't name — or all of them when it has none — as JSON text (empty = none). */
  widgetOptionsJson: string;
  /** A slot's name — read-only (its content is runtime React, owned by `<ControlPanel>`). */
  slot: string;
}

/** react-hook-form state for one panel. */
export interface ControlPanelFormState {
  panel: ControlPanelFields;
  items: ControlItemFields[];
}

/** Sentinel for "no icon" / "not set" in a select. */
export const NO_ICON = '__none__';

/** Sentinel for "not set — the command's default" in an argument select. */
export const ARG_DEFAULT = '__default__';

/** A JSON field that failed to parse, reported instead of submitting. */
export interface ControlPanelFormError {
  /** Item index, or `null` for a panel-level field. */
  item: number | null;
  field: string;
  message: string;
}
