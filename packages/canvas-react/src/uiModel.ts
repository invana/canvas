// Headless UI descriptor model — the data contract that canvas-react's builder
// hooks (`useHistorySection`, `useViewSection`, `useEditorSection`,
// `useLayoutsSection`, `useStyleEditorSection`, `useEntityEditor`) PRODUCE.
//
// The `@invana/canvas-ui` renderer (`ToolbarItems`) and building blocks own the
// **public** copies of these types (`components/ToolbarItem.ts` /
// `components/types.ts` / `components/PropertiesEditor.tsx`). These are pure,
// structurally-identical mirrors kept here so the headless hooks can type their
// return values **without importing `@invana/canvas-ui`** (which would create a
// dependency cycle — the dependency runs canvas-ui → canvas-react, never back).
// Structural typing bridges the two: a hook's `ToolbarItem[]` is assignable to
// the canvas-ui renderer's `ToolbarItem[]` because the shapes match. Keep these
// in sync with the canvas-ui definitions.
import type { ComponentType, ReactNode } from 'react';

/**
 * Icon component accepted by the UI controls — icon-agnostic (the consumer
 * passes e.g. a `lucide-react` glyph). Mirror of the canvas-ui `ToolbarIcon`.
 */
export type ToolbarIcon = ComponentType<{ size?: number | string; className?: string }>;

/** Side a tooltip is placed on. Mirror of the canvas-ui `TooltipSide`. */
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/** Fields shared by every {@link ToolbarItem} variant. */
interface ToolbarItemBase {
  /** Stable React key for the rendered control. */
  key?: string;
}

/** A plain action button. */
export interface ToolbarButtonItem extends ToolbarItemBase {
  type: 'button';
  icon: ToolbarIcon;
  iconClass?: string;
  label: string;
  text?: string;
  onClick: () => void;
  disabled?: boolean;
  tooltipSide?: TooltipSide;
}

/** A two-state toggle (lock view, grid, theme, modeller tool, …). */
export interface ToolbarToggleItem extends ToolbarItemBase {
  type: 'toggle';
  icon: ToolbarIcon;
  activeIcon?: ToolbarIcon;
  iconClass?: string;
  label: string;
  activeLabel?: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  tooltipSide?: TooltipSide;
}

/** A single-select dropdown (layout / select-mode / edge-type / shape / zoom). */
export interface ToolbarSelectItem extends ToolbarItemBase {
  type: 'select';
  label: string;
  value: string;
  options: Record<string, string>;
  icons?: Record<string, ToolbarIcon>;
  iconClass?: string;
  onChange: (value: string) => void;
  display?: 'dropdown' | 'segmented';
  className?: string;
  align?: 'start' | 'center' | 'end';
  tooltip?: string;
  tooltipSide?: TooltipSide;
  triggerLabelOnly?: boolean;
  renderTrigger?: () => ReactNode;
}

/** A visual group separator. */
export interface ToolbarDividerItem extends ToolbarItemBase {
  type: 'divider';
}

/** An escape hatch for arbitrary inline content. */
export interface ToolbarCustomItem extends ToolbarItemBase {
  type: 'custom';
  render: () => ReactNode;
}

/** A single declarative toolbar control. */
export type ToolbarItem =
  | ToolbarButtonItem
  | ToolbarToggleItem
  | ToolbarSelectItem
  | ToolbarDividerItem
  | ToolbarCustomItem;

/**
 * The values a properties editor edits: a label + a flat string→string data map.
 * Mirror of the canvas-ui `PropertiesEditorValues`.
 */
export interface PropertiesEditorValues {
  label: string;
  type?: string;
  data: Record<string, string>;
}
