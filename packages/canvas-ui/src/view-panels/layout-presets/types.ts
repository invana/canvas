// Layout presets, as the picker draws them. A preset is a **card** (what the
// user picks) plus the **options** it accepts (how they tune it). Applying one —
// running its layout, setting edge shape, label placement and spacing as one
// undo step — is the engine's job; these types describe only what is shown and
// what comes back.

import type { ReactNode } from 'react';

/** The four shapes a preset card can draw as its picture. */
export type LayoutPresetPicture = 'network' | 'tree' | 'flow' | 'radial';

/** One card in the picker. */
export interface LayoutPresetCard {
  /** Preset id — what `onSelect` reports. */
  id: string;
  /** Card title, e.g. `Flow →`. */
  label: string;
  /** One line under the title, e.g. `What leads to what`. */
  description?: string;
  /** The picture: a built-in shape, or any node. */
  picture: LayoutPresetPicture | ReactNode;
  /**
   * Why the card can't be picked — `Draws up to 3,000 nodes · this board has
   * 24,477`. Present means disabled; the reason is the card's tooltip.
   */
  disabledReason?: string;
}

/** One choice of a preset option. */
export interface LayoutPresetChoice {
  value: string;
  label: string;
}

/** One option row under the cards. */
export interface LayoutPresetOption {
  /** Key in the values record, e.g. `edges`. */
  key: string;
  /** Row label, e.g. `Edges`. */
  label: string;
  choices: readonly LayoutPresetChoice[];
}

/** The picked preset and the options changed over its defaults. */
export interface LayoutPresetValue {
  presetId: string;
  /** Only the options that differ from the preset's defaults. */
  overrides: Readonly<Record<string, string>>;
}
