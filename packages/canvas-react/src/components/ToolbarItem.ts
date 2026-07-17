import type { ReactNode } from 'react';

import type { ToolbarIcon, TooltipSide } from './types';

/**
 * Fields shared by every {@link ToolbarItem} variant.
 *
 * The descriptor model is the data contract between the **section hooks**
 * (`useHistorySection`, `useViewSection`, …) — or any hand-built array off the
 * raw hooks — and the {@link ToolbarItems} renderer that compiles them into a
 * toolbar.
 * Everything here is engine-agnostic — icons, strings, callbacks, `ReactNode` —
 * so the type stays a dumb building block (no `@invana/canvas` import).
 */
interface ToolbarItemBase {
  /**
   * Stable React key for the rendered control. Builder hooks set semantic keys
   * (e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
   * falls back to `` `${type}-${index}` `` when omitted.
   */
  key?: string;
}

/** A plain action button. Rendered as a design-kit ghost `Button`. */
export interface ToolbarButtonItem extends ToolbarItemBase {
  type: 'button';
  /** Icon component (icon-agnostic — e.g. a `lucide-react` glyph). */
  icon: ToolbarIcon;
  /** Optional className applied to the rendered icon (sizing / colour / state tint). */
  iconClass?: string;
  /** Tooltip content + accessible label. */
  label: string;
  /**
   * Optional visible text shown next to the icon. When set, the button renders
   * as a labelled `'sm'` button (not icon-only) — e.g. the selection-aware
   * clear's "Selection" affordance.
   */
  text?: string;
  onClick: () => void;
  /** Greys the button and blocks the click. Default `false`. */
  disabled?: boolean;
  /** Tooltip-side override; otherwise the renderer's `tooltipSide` applies. */
  tooltipSide?: TooltipSide;
}

/**
 * A two-state toggle (lock view, grid, theme, modeller tool, …). Rendered as a
 * ghost `Button` with the design-kit nav-item active treatment; the icon and
 * label flip with {@link ToolbarToggleItem.active}.
 */
export interface ToolbarToggleItem extends ToolbarItemBase {
  type: 'toggle';
  /** Icon shown while inactive (and while active, unless `activeIcon` is set). */
  icon: ToolbarIcon;
  /** Icon shown while active. Defaults to `icon` — active styling alone signals state. */
  activeIcon?: ToolbarIcon;
  /** Optional className applied to the rendered icon (sizing / colour / state tint). */
  iconClass?: string;
  /** Tooltip + label in the inactive state. */
  label: string;
  /** Tooltip + label in the active state. Defaults to `label`. */
  activeLabel?: string;
  active: boolean;
  onToggle: () => void;
  /** Greys the button and blocks the toggle. Default `false`. */
  disabled?: boolean;
  tooltipSide?: TooltipSide;
}

/** A single-select dropdown (layout / select-mode / edge-type / shape / zoom). Rendered as a design-kit `RichSelect`. */
export interface ToolbarSelectItem extends ToolbarItemBase {
  type: 'select';
  /** Trigger label + menu heading (e.g. `'Layout'`). */
  label: string;
  /** Currently-selected option key. */
  value: string;
  /** Option key → human label. */
  options: Record<string, string>;
  /** Optional option key → icon, surfaced on the trigger + beside each option. */
  icons?: Record<string, ToolbarIcon>;
  /** Optional className applied to the trigger icon. */
  iconClass?: string;
  onChange: (value: string) => void;
  /**
   * How to render the picker. `'dropdown'` (default) is the collapsed
   * `RichSelect` trigger + menu. `'segmented'` lays every option out inline as a
   * single-select `ToggleGroup` (the B / I / U style) — good for a small, always
   * in-view option set. Segmented items show their per-option icon when present
   * (icon-only, full label on hover) and fall back to the option label text
   * otherwise; {@link triggerLabelOnly} / {@link renderTrigger} don't apply.
   */
  display?: 'dropdown' | 'segmented';
  /**
   * Extra classes for the `'segmented'` group container. Segments are
   * borderless by default (the ghost toggle variant); pass border utilities here
   * to opt back into a bordered/outlined segmented control.
   */
  className?: string;
  /** Menu alignment relative to the trigger. Default `'start'`. */
  align?: 'start' | 'center' | 'end';
  /** Trigger tooltip; defaults to {@link ToolbarSelectItem.label}. */
  tooltip?: string;
  tooltipSide?: TooltipSide;
  /**
   * Show only the section {@link label} (+ active icon) on the collapsed trigger,
   * not the selected option's label — so the trigger reads `Select` instead of
   * `Select: Click select`. Use when the per-option icon already conveys the
   * choice (e.g. the select-mode picker) and repeating the option name on the
   * trigger is noise. The open dropdown still lists full option labels. Ignored
   * when {@link renderTrigger} is provided.
   */
  triggerLabelOnly?: boolean;
  /**
   * Override the trigger content (instead of the default `{label}: {value}`).
   * Used by the zoom picker to show a live `NN%` even when the current value
   * isn't one of the preset options.
   */
  renderTrigger?: () => ReactNode;
}

/** A visual group separator. Compiles to a design-kit `Separator` on the cross axis. */
export interface ToolbarDividerItem extends ToolbarItemBase {
  type: 'divider';
}

/**
 * An escape hatch for arbitrary content that doesn't fit the
 * button/toggle/select mould — e.g. a live zoom readout, a brand element, or a
 * consumer's own widget. The renderer calls {@link ToolbarCustomItem.render}
 * and drops the result inline.
 */
export interface ToolbarCustomItem extends ToolbarItemBase {
  type: 'custom';
  render: () => ReactNode;
}

/**
 * A single declarative toolbar control. Build arrays of these with the builder
 * hooks (or by hand) and render them with {@link ToolbarItems}; concatenate
 * arrays with `divider` items between groups to assemble a full toolbar.
 */
export type ToolbarItem =
  | ToolbarButtonItem
  | ToolbarToggleItem
  | ToolbarSelectItem
  | ToolbarDividerItem
  | ToolbarCustomItem;

/**
 * Swap the `icon` of `button` / `toggle` items whose {@link ToolbarItemBase.key}
 * matches a key in `icons`. Partial — unlisted items keep their baked icon. This
 * is how the turnkey `*Toolbar` components honour their optional `icons` prop
 * without the section hooks ever taking icons: build items (with baked defaults),
 * then `applyIconOverrides(items, props.icons)` before rendering.
 *
 * Note: only the primary `icon` is overridden (not a toggle's `activeIcon`, nor a
 * `select`'s per-option `icons`).
 */
export function applyIconOverrides(
  items: ToolbarItem[],
  icons?: Partial<Record<string, ToolbarIcon>>,
): ToolbarItem[] {
  if (!icons) return items;
  return items.map((item) =>
    (item.type === 'button' || item.type === 'toggle') && item.key && icons[item.key]
      ? { ...item, icon: icons[item.key]! }
      : item,
  );
}
