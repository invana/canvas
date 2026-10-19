// LayoutPresetOptions — the active preset's options, one row each: a label and
// the kit's segmented control. A value that differs from the preset's default
// is an override; *Reset to …* shows only while there is one.

import { Button, Eyebrow, SegmentedControl, cn } from '@invana/ui';

import type { LayoutPresetOption } from './types';

export interface LayoutPresetOptionsProps {
  /** Heading over the rows, e.g. `Flow → options`. */
  title?: string;
  options: readonly LayoutPresetOption[];
  /** The preset's defaults, by option key. */
  defaults: Readonly<Record<string, string>>;
  /** Options changed over the defaults. */
  overrides: Readonly<Record<string, string>>;
  onChange: (key: string, value: string) => void;
  className?: string;
}

/** One segmented row per option of the active preset. */
export function LayoutPresetOptions({ title, options, defaults, overrides, onChange, className }: LayoutPresetOptionsProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {title && <Eyebrow>{title}</Eyebrow>}
      {options.map((option) => (
        <div key={option.key} className="flex items-center gap-2 py-0.5">
          <span className="min-w-0 flex-1">{option.label}</span>
          <SegmentedControl
            size="xs"
            className="shrink-0"
            aria-label={option.label}
            options={option.choices.map((c) => ({ value: c.value, label: c.label }))}
            value={overrides[option.key] ?? defaults[option.key] ?? null}
            onValueChange={(v) => onChange(option.key, v)}
          />
        </div>
      ))}
    </div>
  );
}

/** Whether any override differs from its default — what shows *Reset to …*. */
export function hasOverrides(defaults: Readonly<Record<string, string>>, overrides: Readonly<Record<string, string>>) {
  return Object.entries(overrides).some(([k, v]) => defaults[k] !== v);
}

export interface LayoutPresetResetProps {
  presetLabel: string;
  onReset: () => void;
}

/** `Reset to Flow →` — a link-weight button. */
export function LayoutPresetReset({ presetLabel, onReset }: LayoutPresetResetProps) {
  return (
    <Button variant="link" size="sm" className="h-auto p-0" onClick={onReset}>
      Reset to {presetLabel}
    </Button>
  );
}
