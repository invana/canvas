import { useState } from 'react';
import type { ReactNode } from 'react';
import type { GraphCanvas } from '@invana/graph';

import type { ToolbarIcon, ToolbarToggleItem } from '../components';
import type { GraphCanvasAppControlContext, GraphCanvasAppSectionOptions } from '../apps';

/**
 * A dockable side panel, described declaratively. The hook turns each of these
 * into a header **toggle item** and (while open) the **`right` region** body — so
 * you never hand-wire the toggle, the open-state, or the region render-fn per app.
 */
export interface SidePanelDef {
  /** Stable id — the toggle key + the "which panel is open" discriminator. */
  id: string;
  /** Toggle icon shown in the shared toolbar (inactive, and active unless {@link activeIcon}). */
  icon: ToolbarIcon;
  /** Icon while the panel is open — an open/close flip (e.g. `PanelRightOpen` ⇄ `PanelRightClose`). */
  activeIcon?: ToolbarIcon;
  /**
   * Toggle label. The item flips `"<label>: hidden"` ⇄ `"<label>: shown"` with the
   * open-state (a `ToolbarItems` toggle convention); pass `activeLabel` to override.
   */
  label: string;
  /** Label while the panel is open. Default `"<label>: shown"`. */
  activeLabel?: string;
  /** Panel body — handed the live engine (`null` until every layer registers). */
  render: (canvas: GraphCanvas | null) => ReactNode;
  /** Per-panel initial region size (overrides {@link UseSidePanelsOptions.section}). */
  defaultSize?: number | string;
  /** Per-panel minimum region size. */
  minSize?: number | string;
  /** Per-panel maximum region size. */
  maxSize?: number | string;
  /** Per-panel: allow the drag handle to fully collapse the region. */
  collapsible?: boolean;
}

export interface UseSidePanelsOptions {
  /** Which panel starts open. Default `null` (none). */
  defaultOpenId?: string | null;
  /** Region-size defaults applied to every panel unless its def overrides them. */
  section?: Pick<GraphCanvasAppSectionOptions, 'defaultSize' | 'minSize' | 'maxSize' | 'collapsible'>;
}

export interface UseSidePanelsResult {
  /** The currently-open panel id, or `null`. */
  openId: string | null;
  /** Open a specific panel, or `null` to close whatever's open. */
  open: (id: string | null) => void;
  /** Toggle a panel — opens it, or closes it if it's already the open one. */
  toggle: (id: string) => void;
  /** Toolbar toggle items — spread into a **single** shared `<ToolbarItems>`. */
  items: ToolbarToggleItem[];
  /** The open panel's region config for `GraphCanvasApp`'s `right` (or `bottom`); `undefined` when none is open. */
  region: GraphCanvasAppSectionOptions | undefined;
}

/**
 * Turnkey **activity-bar** for `GraphCanvasApp` side panels: from a list of
 * {@link SidePanelDef}s it manages a single open-panel state and returns the
 * `items` (one shared toolbar of toggles) plus the active panel's `region` — so a
 * consumer wires it in two lines and the shell stays panel-agnostic:
 *
 * ```tsx
 * const dock = useSidePanels([
 *   { id: 'filters', icon: Filter, label: 'Filters', render: (c) => <CanvasFiltersViewPanel canvas={c} /> },
 *   { id: 'find',    icon: Search, label: 'Find',    render: (c) => <FindInCanvasViewPanel  canvas={c} /> },
 * ]);
 * <GraphCanvasApp
 *   header={{ right: <ToolbarItems items={dock.items} /> }}
 *   right={dock.region}
 * />
 * ```
 *
 * At most one panel occupies the region at a time (toggling one on swaps the dock;
 * toggling it off drops the region so the canvas reclaims the space). It owns only
 * the open-state — the panels' own state lives in the panels.
 */
export function useSidePanels(panels: SidePanelDef[], options: UseSidePanelsOptions = {}): UseSidePanelsResult {
  const { defaultOpenId = null, section } = options;
  const [openId, setOpen] = useState<string | null>(defaultOpenId);
  const toggle = (id: string): void => setOpen((cur) => (cur === id ? null : id));

  const items: ToolbarToggleItem[] = panels.map((p) => ({
    type: 'toggle',
    key: p.id,
    icon: p.icon,
    ...(p.activeIcon ? { activeIcon: p.activeIcon } : {}),
    label: `${p.label}: hidden`,
    activeLabel: p.activeLabel ?? `${p.label}: shown`,
    active: openId === p.id,
    onToggle: () => toggle(p.id),
  }));

  const active = panels.find((p) => p.id === openId);
  const region: GraphCanvasAppSectionOptions | undefined = active
    ? {
        content: (ctx: GraphCanvasAppControlContext) => active.render(ctx.canvas),
        defaultSize: active.defaultSize ?? section?.defaultSize ?? '360px',
        minSize: active.minSize ?? section?.minSize,
        maxSize: active.maxSize ?? section?.maxSize,
        collapsible: active.collapsible ?? section?.collapsible ?? true,
      }
    : undefined;

  return { openId, open: setOpen, toggle, items, region };
}
