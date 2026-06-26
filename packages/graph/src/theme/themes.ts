/**
 * The six built-in {@link Theme} families, each with full light + dark variants.
 * Authored once here; the {@link ThemeBehaviour} merges any consumer-supplied
 * themes over these. Colours are concrete `0xRRGGBB` numbers — resolved straight
 * to the renderer with no string parsing.
 */

import type { Theme, ThemeRegistry } from './types';

/** Shared fill-by-category ramp — distinct, mid-saturation hues that read on
 * both light and dark backdrops. Individual themes may override. */
const CATEGORICAL: number[] = [
  0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xeab308, 0x14b8a6,
  0xa3e635, 0xf97316, 0x6366f1,
];

export const DEFAULT_THEME: Theme = {
  name: 'default',
  label: 'Default',
  light: {
    surface: 0xf8fafc,
    cardBg: 0xffffff,
    foreground: 0x334155,
    heading: 0x0f172a,
    muted: 0x64748b,
    accent: 0x3b82f6,
    divider: 0xe2e8f0,
    stroke: 0xcbd5e1,
    selectionRing: 0x3b82f6,
    hoverRing: 0x93c5fd,
    categorical: CATEGORICAL,
  },
  dark: {
    surface: 0x0f172a,
    cardBg: 0x1e293b,
    foreground: 0xe2e8f0,
    heading: 0xf8fafc,
    muted: 0x94a3b8,
    accent: 0x60a5fa,
    divider: 0x334155,
    stroke: 0x475569,
    selectionRing: 0x60a5fa,
    hoverRing: 0x3b82f6,
    categorical: CATEGORICAL,
  },
};

export const FOREST_THEME: Theme = {
  name: 'forest',
  label: 'Forest',
  light: {
    surface: 0xf4f7f2,
    cardBg: 0xffffff,
    foreground: 0x2f3e34,
    heading: 0x14271a,
    muted: 0x5d6f60,
    accent: 0x2f9e63,
    divider: 0xd9e4d6,
    stroke: 0xb9ccb3,
    selectionRing: 0x2f9e63,
    hoverRing: 0x86c79f,
    categorical: [
      0x2f9e63, 0x4ade80, 0x84cc16, 0xeab308, 0x14b8a6, 0x0ea5a4, 0x65a30d, 0xa3a30d, 0x16a34a,
      0xca8a04, 0x059669, 0x9acd32,
    ],
  },
  dark: {
    surface: 0x0b140d,
    cardBg: 0x15241a,
    foreground: 0xd7e6d8,
    heading: 0xeaf4ea,
    muted: 0x8aa68f,
    accent: 0x4ade80,
    divider: 0x25372a,
    stroke: 0x34503b,
    selectionRing: 0x4ade80,
    hoverRing: 0x22c55e,
    categorical: [
      0x4ade80, 0x22c55e, 0xa3e635, 0xfacc15, 0x2dd4bf, 0x34d399, 0x84cc16, 0xd9f99d, 0x16a34a,
      0xfde047, 0x10b981, 0xbef264,
    ],
  },
};

export const OCEAN_THEME: Theme = {
  name: 'ocean',
  label: 'Ocean',
  light: {
    surface: 0xf1f6fb,
    cardBg: 0xffffff,
    foreground: 0x243b53,
    heading: 0x0b2540,
    muted: 0x5a7184,
    accent: 0x2f7fd1,
    divider: 0xd6e4f0,
    stroke: 0xb3cde0,
    selectionRing: 0x2f7fd1,
    hoverRing: 0x8ec3eb,
    categorical: [
      0x2f7fd1, 0x38bdf8, 0x0ea5e9, 0x6366f1, 0x8b5cf6, 0x06b6d4, 0x3b82f6, 0x0891b2, 0x2563eb,
      0x7c3aed, 0x0284c7, 0x4f46e5,
    ],
  },
  dark: {
    surface: 0x07131f,
    cardBg: 0x0e2235,
    foreground: 0xcfe2f2,
    heading: 0xe6f1fb,
    muted: 0x88a6bf,
    accent: 0x38bdf8,
    divider: 0x1d3550,
    stroke: 0x2b4a6b,
    selectionRing: 0x38bdf8,
    hoverRing: 0x0ea5e9,
    categorical: [
      0x38bdf8, 0x0ea5e9, 0x60a5fa, 0x818cf8, 0xa78bfa, 0x22d3ee, 0x3b82f6, 0x06b6d4, 0x6366f1,
      0x8b5cf6, 0x0ea5e9, 0x7dd3fc,
    ],
  },
};

export const GOLD_THEME: Theme = {
  name: 'gold',
  label: 'Gold',
  light: {
    surface: 0xfbf8f0,
    cardBg: 0xffffff,
    foreground: 0x4a3f2a,
    heading: 0x2a2110,
    muted: 0x7a6c4f,
    accent: 0xcf9b27,
    divider: 0xece3cc,
    stroke: 0xddcfa6,
    selectionRing: 0xcf9b27,
    hoverRing: 0xe6c873,
    categorical: CATEGORICAL,
  },
  dark: {
    surface: 0x14110a,
    cardBg: 0x251f12,
    foreground: 0xece1c6,
    heading: 0xf7efda,
    muted: 0xb3a079,
    accent: 0xf5c542,
    divider: 0x352c18,
    stroke: 0x4a3d22,
    selectionRing: 0xf5c542,
    hoverRing: 0xd4a017,
    categorical: CATEGORICAL,
  },
};

export const ROSE_THEME: Theme = {
  name: 'rose',
  label: 'Rose',
  light: {
    surface: 0xfdf4f6,
    cardBg: 0xffffff,
    foreground: 0x4d2f38,
    heading: 0x2c121b,
    muted: 0x80606b,
    accent: 0xdb2777,
    divider: 0xf1d9e1,
    stroke: 0xe2b8c6,
    selectionRing: 0xdb2777,
    hoverRing: 0xf0a6c4,
    categorical: CATEGORICAL,
  },
  dark: {
    surface: 0x1a0f14,
    cardBg: 0x2a1822,
    foreground: 0xf0d9e2,
    heading: 0xfbeef3,
    muted: 0xb78a9b,
    accent: 0xf472b6,
    divider: 0x3a2330,
    stroke: 0x4f2f40,
    selectionRing: 0xf472b6,
    hoverRing: 0xec4899,
    categorical: CATEGORICAL,
  },
};

export const MINIMAL_THEME: Theme = {
  name: 'minimal',
  label: 'Minimal',
  light: {
    surface: 0xffffff,
    cardBg: 0xffffff,
    foreground: 0x1f2937,
    heading: 0x111827,
    muted: 0x6b7280,
    accent: 0x111827,
    divider: 0xe5e7eb,
    stroke: 0xd1d5db,
    selectionRing: 0x111827,
    hoverRing: 0x9ca3af,
    categorical: [
      0x111827, 0x374151, 0x6b7280, 0x9ca3af, 0x4b5563, 0x1f2937, 0xd1d5db, 0x52525b, 0x71717a,
      0xa1a1aa, 0x3f3f46, 0x818181,
    ],
  },
  dark: {
    surface: 0x0a0a0a,
    cardBg: 0x171717,
    foreground: 0xe5e5e5,
    heading: 0xfafafa,
    muted: 0xa3a3a3,
    accent: 0xfafafa,
    divider: 0x262626,
    stroke: 0x404040,
    selectionRing: 0xfafafa,
    hoverRing: 0x737373,
    categorical: [
      0xfafafa, 0xd4d4d4, 0xa3a3a3, 0x737373, 0xe5e5e5, 0xb5b5b5, 0x525252, 0xcacaca, 0x959595,
      0x808080, 0xbdbdbd, 0x6b6b6b,
    ],
  },
};

/** All built-in themes, keyed by name. Consumer themes merge over these. */
export const BUILT_IN_THEMES: ThemeRegistry = {
  default: DEFAULT_THEME,
  forest: FOREST_THEME,
  ocean: OCEAN_THEME,
  gold: GOLD_THEME,
  rose: ROSE_THEME,
  minimal: MINIMAL_THEME,
};
