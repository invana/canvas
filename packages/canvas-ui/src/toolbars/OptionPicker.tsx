import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@invana/ui';

export interface OptionPickerProps {
  /** Label shown on the trigger and as the menu heading (e.g. `'Layout'`). */
  label: string;
  /** Currently selected option key. */
  value: string;
  /** Option key → human label. */
  options: Record<string, string>;
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
  onChange,
  align = 'start',
  className,
}: OptionPickerProps) {
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
          {label}: {options[value] ?? value}
        </Button>
      </DropdownMenuTrigger>
      {/* Force a solid token-driven background: the design-kit's default
          popover styling is a translucent frosted glass (`bg-popover/80` +
          backdrop-blur), which reads as transparent over a busy canvas. */}
      <DropdownMenuContent align={align} style={{ backgroundColor: 'var(--color-popover)' }}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {Object.keys(options).map((key) => (
            <DropdownMenuRadioItem key={key} value={key}>
              {options[key] ?? key}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
