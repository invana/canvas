import { Fragment, type ReactNode } from 'react';
import { Button, NavHorizontal, NavVertical, RichSelect, Separator, type RichSelectOption } from '@invana/ui';

import { Tooltipped } from './Tooltipped';
import { ACTIVE_CLASS, ACTIVE_MENU_ITEM_CLASS } from './styles';
import type { ToolbarIcon, TooltipSide } from './types';
import type { ToolbarButtonItem, ToolbarItem, ToolbarSelectItem, ToolbarToggleItem } from './ToolbarItem';

export interface ToolbarItemsProps {
  /** The declarative item list to compile into controls. */
  items: ToolbarItem[];
  /** Layout direction of the underlying design-kit Nav shell. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Default tooltip side for button/toggle/select items that don't set their
   * own. Defaults to `'bottom'` (horizontal) / `'right'` (vertical), matching
   * the design-kit Nav tooltip conventions.
   */
  tooltipSide?: TooltipSide;
  /** Forwarded to the Nav shell container. */
  className?: string;
}

/** Render an icon-button / labelled-button (shared by `button` + `toggle`). */
function renderButton(
  key: string,
  opts: {
    icon: ToolbarIcon;
    iconClass?: string;
    label: string;
    text?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    tooltipSide: TooltipSide;
  },
): ReactNode {
  const { icon: Icon, iconClass, label, text, active = false, disabled = false, onClick, tooltipSide } = opts;
  return (
    <Tooltipped key={key} label={label} side={tooltipSide}>
      <Button
        variant="ghost"
        size={text ? 'sm' : 'icon'}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={active ? ACTIVE_CLASS : undefined}
      >
        <Icon size={16} className={iconClass} />
        {text ?? null}
      </Button>
    </Tooltipped>
  );
}

/** Render a `select` item as a design-kit `RichSelect` (was `OptionPicker`). */
function renderSelect(key: string, item: ToolbarSelectItem, tipSide: TooltipSide): ReactNode {
  const { label, value, options, icons, onChange, align = 'start', tooltip, renderTrigger } = item;
  const richOptions: RichSelectOption[] = Object.keys(options).map((k) => ({
    value: k,
    label: options[k] ?? k,
    icon: icons?.[k],
  }));
  return (
    <RichSelect
      key={key}
      options={richOptions}
      value={value}
      onChange={(v) => onChange(v as string)}
      label={label}
      align={align}
      tooltip={tooltip ?? label}
      tooltipSide={item.tooltipSide ?? tipSide}
      renderValue={
        renderTrigger
          ? () => renderTrigger()
          : (selected) => {
              const only = selected[0];
              const ActiveIcon = only?.icon as ToolbarIcon | undefined;
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ActiveIcon && <ActiveIcon size={16} className={item.iconClass} />}
                  {label}: {only?.label ?? value}
                </span>
              );
            }
      }
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

/**
 * Data-driven toolbar renderer — the single building block every `*Toolbar`
 * preset is assembled from. Compiles a {@link ToolbarItem}[] into design-kit
 * chrome (`@invana/ui` `Button` / `RichSelect` / `Separator`, with a shared
 * {@link Tooltipped}) inside a `NavHorizontal` / `NavVertical` shell:
 *
 * - `button` → a ghost `Button` (icon-only, or icon + `text`), with `disabled`.
 * - `toggle` → a ghost `Button` with the nav-item `active` treatment; icon/label flip.
 * - `select` → a `RichSelect` dropdown (optionally with a custom `renderTrigger`).
 * - `divider` → a cross-axis `Separator`.
 * - `custom` → the item's own `render()` output.
 *
 * It's a dumb component (no engine import): pair it with the section hooks
 * (`useHistorySection`, `useViewSection`, …) or a hand-built item array off the
 * raw hooks.
 */
export function ToolbarItems({
  items,
  orientation = 'horizontal',
  tooltipSide,
  className,
}: ToolbarItemsProps) {
  const tipSide: TooltipSide = tooltipSide ?? (orientation === 'vertical' ? 'right' : 'bottom');

  const nodes: ReactNode[] = items.map((item, i) => {
    const key = item.key ?? `${item.type}-${i}`;
    switch (item.type) {
      case 'button': {
        const it: ToolbarButtonItem = item;
        return renderButton(key, {
          icon: it.icon,
          ...(it.iconClass !== undefined ? { iconClass: it.iconClass } : {}),
          label: it.label,
          ...(it.text !== undefined ? { text: it.text } : {}),
          ...(it.disabled !== undefined ? { disabled: it.disabled } : {}),
          onClick: it.onClick,
          tooltipSide: it.tooltipSide ?? tipSide,
        });
      }
      case 'toggle': {
        const it: ToolbarToggleItem = item;
        const Icon = it.active ? it.activeIcon ?? it.icon : it.icon;
        const label = it.active ? it.activeLabel ?? it.label : it.label;
        return renderButton(key, {
          icon: Icon,
          ...(it.iconClass !== undefined ? { iconClass: it.iconClass } : {}),
          label,
          active: it.active,
          ...(it.disabled !== undefined ? { disabled: it.disabled } : {}),
          onClick: it.onToggle,
          tooltipSide: it.tooltipSide ?? tipSide,
        });
      }
      case 'select':
        return renderSelect(key, item, tipSide);
      case 'divider':
        return (
          <Separator
            key={key}
            orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'}
            style={
              orientation === 'vertical'
                ? { width: 24, alignSelf: 'center' }
                : { height: 24, alignSelf: 'center' }
            }
          />
        );
      case 'custom':
        return <Fragment key={key}>{item.render()}</Fragment>;
    }
  });

  const content = <>{nodes}</>;
  return orientation === 'vertical' ? (
    <NavVertical top={content} className={className} />
  ) : (
    <NavHorizontal left={content} className={className} />
  );
}
