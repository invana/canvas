// LayoutPresetPicker — the preset cards: a picture, a name and one line each,
// two to a row. The active card carries the primary ring; a card that can't be
// picked is dimmed and says why in its tooltip, because a greyed card with no
// reason reads as a bug.

import { Tooltip, TooltipContent, TooltipTrigger, cn } from '@invana/ui';
import { isValidElement } from 'react';

import { LayoutPresetThumbnail } from './LayoutPresetThumbnail';
import type { LayoutPresetCard, LayoutPresetPicture } from './types';

export interface LayoutPresetPickerProps {
  presets: readonly LayoutPresetCard[];
  /** The active preset's id. */
  value: string;
  onSelect: (presetId: string) => void;
  className?: string;
}

/** Preset cards, two to a row; the active one ringed, a disabled one explained. */
export function LayoutPresetPicker({ presets, value, onSelect, className }: LayoutPresetPickerProps) {
  return (
    <div role="radiogroup" aria-label="Layout" className={cn('grid grid-cols-2 gap-2', className)}>
      {presets.map((preset) => {
        const card = (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={preset.id === value}
            aria-disabled={preset.disabledReason ? true : undefined}
            onClick={() => {
              if (!preset.disabledReason && preset.id !== value) onSelect(preset.id);
            }}
            className={cn(
              'flex flex-col gap-1 rounded-sm border p-1.5 text-left outline-none transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2',
              preset.id === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
              preset.disabledReason && 'cursor-not-allowed opacity-40 hover:bg-transparent',
            )}
          >
            <span className="bg-background rounded-sm">
              {isPicture(preset.picture) ? <LayoutPresetThumbnail picture={preset.picture} /> : preset.picture}
            </span>
            <span className={cn('font-semibold', preset.id === value && 'text-primary')}>{preset.label}</span>
            {preset.description && <span className="text-muted-foreground text-sm">{preset.description}</span>}
          </button>
        );
        if (!preset.disabledReason) return card;
        return (
          <Tooltip key={preset.id}>
            <TooltipTrigger asChild>{card}</TooltipTrigger>
            <TooltipContent>{preset.disabledReason}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function isPicture(p: LayoutPresetCard['picture']): p is LayoutPresetPicture {
  return typeof p === 'string' && !isValidElement(p);
}
