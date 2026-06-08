import { RichSelect, type RichSelectOption } from '@invana/ui';

import { ACTIVE_MENU_ITEM_CLASS } from './ControlButton';
import type { ToolbarIcon, TooltipSide } from './types';

export interface OptionPickerProps {
  /**
   * Label shown on the trigger and as the menu heading (e.g. `'Layout'`). Also
   * the trigger tooltip content unless {@link OptionPickerProps.tooltip} overrides it.
   */
  label: string;
  /** Currently selected option key. */
  value: string;
  /** Option key → human label. */
  options: Record<string, string>;
  /**
   * Optional option key → icon. When present, the active option's icon shows on
   * the trigger and each option's icon shows beside its label in the menu.
   * Icon-agnostic — pass a {@link ToolbarIcon} (e.g. a `lucide-react` glyph).
   */
  icons?: Record<string, ToolbarIcon>;
  /** Fired with the newly selected key. */
  onChange: (value: string) => void;
  /** Menu alignment relative to the trigger. Default `'start'`. */
  align?: 'start' | 'center' | 'end';
  /** Trigger tooltip content. Defaults to {@link OptionPickerProps.label}. */
  tooltip?: string;
  /** Side the trigger tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  className?: string;
}

/**
 * A single-select dropdown (radio group). Engine-agnostic — drives a `value` +
 * `onChange`. Used as the **layout switcher** and **selection-mode** picker in
 * {@link GraphToolbar}, and standalone for any single-choice control.
 *
 * Thin wrapper over the design-kit `RichSelect`: it owns the outline trigger,
 * trailing chevron, tooltip, and solid popover surface. We keep the toolbar's
 * `{label}: {value}` trigger affordance via `renderValue` and the design-kit
 * selected-item tint ({@link ACTIVE_MENU_ITEM_CLASS}) via `renderOption`.
 */
export function OptionPicker({
  label,
  value,
  options,
  icons,
  onChange,
  align = 'start',
  tooltip,
  tooltipSide,
  className,
}: OptionPickerProps) {
  const richOptions: RichSelectOption[] = Object.keys(options).map((key) => ({
    value: key,
    label: options[key] ?? key,
    icon: icons?.[key],
  }));

  return (
    <RichSelect
      options={richOptions}
      value={value}
      onChange={(v) => onChange(v as string)}
      label={label}
      align={align}
      tooltip={tooltip ?? label}
      tooltipSide={tooltipSide}
      triggerClassName={className}
      renderValue={(selected) => {
        const only = selected[0];
        const ActiveIcon = only?.icon as ToolbarIcon | undefined;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ActiveIcon && <ActiveIcon size={16} />}
            {label}: {only?.label ?? value}
          </span>
        );
      }}
      renderOption={(option, { selected }) => {
        const Icon = option.icon as ToolbarIcon | undefined;
        return (
          <span
            className={selected ? ACTIVE_MENU_ITEM_CLASS : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {Icon && <Icon size={14} />}
            {option.label}
          </span>
        );
      }}
    />
  );
}
