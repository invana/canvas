import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface OptionPickerProps {
  /** Label shown on the trigger and as the menu heading (e.g. `'Layout'`). */
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
  className?: string;
}

/**
 * A single-select dropdown (radio group). Engine-agnostic — drives a `value` +
 * `onChange`. Used as the **layout switcher** and **selection-mode** picker in
 * {@link GraphToolbar}, and standalone for any single-choice control.
 */
export function OptionPicker({
  label,
  value,
  options,
  icons,
  onChange,
  align = 'start',
  className,
}: OptionPickerProps) {
  const ActiveIcon = icons?.[value];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* `ring-offset-background`: the design-kit Button sets `ring-offset-2`
            but no offset colour, so the focus ring's 2px offset falls back to
            Tailwind's default white — a light halo around the open trigger in
            dark mode. Pin it to the `--color-background` token instead. */}
        <Button
          variant="outline"
          size="sm"
          className={['ring-offset-background', className].filter(Boolean).join(' ')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ActiveIcon && <ActiveIcon size={16} />}
            {label}: {options[value] ?? value}
          </span>
        </Button>
      </DropdownMenuTrigger>
      {/* Force a solid token-driven background: the design-kit's default
          popover styling is a translucent frosted glass (`bg-popover/80` +
          backdrop-blur), which reads as transparent over a busy canvas. */}
      <DropdownMenuContent align={align} style={{ backgroundColor: 'var(--color-popover)' }}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {Object.keys(options).map((key) => {
            const Icon = icons?.[key];
            return (
              <DropdownMenuRadioItem key={key} value={key}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {Icon && <Icon size={14} />}
                  {options[key] ?? key}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
