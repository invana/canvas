// LayoutPresetsViewPanel — the Layout popover's body: the preset cards, the
// active preset's options, and a footer with *Reset to …* (only once an option
// differs from the preset's default) and *Run again*.
//
// Controlled and presentational: it reports `{ presetId, overrides }` and runs
// nothing itself. The host turns a value into a layout run — today by running
// the preset's registered layout, once the preset act lands by applying the
// preset as one undo step. Picking another card clears the overrides, because
// an option belongs to the preset it was changed on.

import { Button, Eyebrow, Separator, cn } from '@invana/ui';
import { RotateCcw } from 'lucide-react';

import {
  DEFAULT_LAYOUT_PRESET_CARDS,
  DEFAULT_LAYOUT_PRESET_DEFAULTS,
  DEFAULT_LAYOUT_PRESET_OPTIONS,
} from './defaults';
import { LayoutPresetOptions, LayoutPresetReset, hasOverrides } from './LayoutPresetOptions';
import { LayoutPresetPicker } from './LayoutPresetPicker';
import type { LayoutPresetCard, LayoutPresetOption, LayoutPresetValue } from './types';

export interface LayoutPresetsViewPanelProps {
  value: LayoutPresetValue;
  onChange: (value: LayoutPresetValue) => void;
  /** Re-run the active preset with its current options. */
  onRunAgain?: () => void;
  /** The cards. Default: Network · Tree ↓ · Flow → · Radial. */
  presets?: readonly LayoutPresetCard[];
  /** Options per preset id. Default: the four presets' options. */
  options?: Readonly<Record<string, readonly LayoutPresetOption[]>>;
  /** Defaults per preset id. Default: the four presets' defaults. */
  defaults?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Line in the footer when nothing is overridden. */
  note?: string;
  className?: string;
}

/** Preset cards over the active preset's options, with Reset and Run again. */
export function LayoutPresetsViewPanel({
  value,
  onChange,
  onRunAgain,
  presets = DEFAULT_LAYOUT_PRESET_CARDS,
  options = DEFAULT_LAYOUT_PRESET_OPTIONS,
  defaults = DEFAULT_LAYOUT_PRESET_DEFAULTS,
  note = 'The board keeps what you pick',
  className,
}: LayoutPresetsViewPanelProps) {
  const active = presets.find((p) => p.id === value.presetId);
  const presetDefaults = defaults[value.presetId] ?? {};
  const rows = options[value.presetId] ?? [];
  const changed = hasOverrides(presetDefaults, value.overrides);

  const setOption = (key: string, v: string) => {
    const next = { ...value.overrides };
    if (presetDefaults[key] === v) delete next[key];
    else next[key] = v;
    onChange({ presetId: value.presetId, overrides: next });
  };

  return (
    <div className={cn('flex w-[22rem] flex-col', className)}>
      <div className="flex flex-col gap-2 p-3">
        <Eyebrow>Layout</Eyebrow>
        <LayoutPresetPicker presets={presets} value={value.presetId} onSelect={(id) => onChange({ presetId: id, overrides: {} })} />
      </div>
      {rows.length > 0 && (
        <>
          <Separator />
          <LayoutPresetOptions
            className="p-3"
            title={active ? `${active.label} options` : undefined}
            options={rows}
            defaults={presetDefaults}
            overrides={value.overrides}
            onChange={setOption}
          />
        </>
      )}
      <Separator />
      <div className="flex items-center gap-2 px-3 py-2">
        {changed && active ? (
          <LayoutPresetReset presetLabel={active.label} onReset={() => onChange({ presetId: value.presetId, overrides: {} })} />
        ) : (
          <span className="text-muted-foreground text-sm">{note}</span>
        )}
        <span className="flex-1" />
        {onRunAgain && (
          <Button variant="ghost" size="sm" onClick={onRunAgain}>
            <RotateCcw /> Run again
          </Button>
        )}
      </div>
    </div>
  );
}
