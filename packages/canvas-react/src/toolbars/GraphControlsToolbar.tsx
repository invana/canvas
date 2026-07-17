/**
 * `<GraphControlsToolbar>` / `<GraphControlsToolbarLite>` — turnkey **header
 * control bars** for a graph canvas, assembled from the package's section hooks
 * (`useLayout`, `useViewSection`, `useSelectMode`, `useGrid`,
 * `useStyleEditorSection`, `useHistorySection`, `useEditorSection`) into a single
 * data-driven `<ToolbarItems>`.
 *
 * Two presets cover ~80% of cases out of the box:
 *
 *   - **`GraphControlsToolbarLite`** — read-only-explorer controls: layout picker
 *     + run, zoom / fit / lock, select-mode, grid. No history / clipboard, so no
 *     providers are mounted.
 *   - **`GraphControlsToolbar`** (full) — the lite set plus undo/redo, the
 *     edge-routing style editor, and erase/clear. It self-wraps the
 *     `GraphHistoryProvider` + `GraphClipboardProvider` those sections need.
 *
 * Both share one core, so they never drift. Each item carries its own (lucide)
 * icon inline — there's no parallel icon-set prop. Extend for the other 20% by
 * toggling sections off (`sections={{ grid: false }}`) or injecting your own
 * items (`extraItems`), where you supply whatever icon you like per item. Need
 * something fully bespoke? Skip these and compose the section hooks yourself.
 *
 * **Contract:** render where a live engine is resolvable — inside `<Canvas>`, or
 * under a lifted `GraphCanvasContext` whose value is non-null (gate on it). The
 * header apps render the toolbar only once `canvas` exists.
 *
 * Unlike the floating, `Panel`-wrapped toolbars (`ViewToolbar`, `GridToolbar`,
 * …), this renders a **bare** `<ToolbarItems>` meant to be dropped into a header
 * slot. (Supersedes the callback-driven {@link GraphToolbar} for header use.)
 */

import { type ReactNode } from 'react';
import type { GraphCanvas } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { Grid3x3, Lasso, MousePointer2, Play, SquareDashedMousePointer } from 'lucide-react';

import { useGraphCanvas } from '../GraphCanvasContext';
import { GraphClipboardProvider, GraphHistoryProvider } from '../providers';
import {
  type LayoutFactory,
  useEditorSection,
  useGrid,
  useHistorySection,
  useLayout,
  useSelectMode,
  useStyleEditorSection,
  useViewSection,
} from '../hooks';
import { ToolbarItems, applyIconOverrides, type ToolbarIcon, type ToolbarItem } from '../components';

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** Default layout-picker factory — one fresh d3-force instance per application. */
const DEFAULT_LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({
      charge: { strength: -160 },
      link: { distance: 56 },
      collide: { radius: 14 },
      animate: false,
    }),
};
const DEFAULT_LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force (d3)' };

/** Select-mode key → registered behaviour id. Click = no drag-select behaviour. */
const SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};

// ─── Props ──────────────────────────────────────────────────────────────────

/** Per-section visibility. Omitted keys default on (for that variant). */
export interface GraphControlsSections {
  /** Undo / redo (full only). */
  history?: boolean;
  /** Layout picker + run. */
  layout?: boolean;
  /** Click / brush / lasso select-mode picker. */
  selectMode?: boolean;
  /** Edge-routing style editor (full only). */
  style?: boolean;
  /** Erase / clear (full only). */
  edit?: boolean;
  /** Zoom in / out · fit · lock. */
  view?: boolean;
  /** Grid toggle. */
  grid?: boolean;
}

export interface GraphControlsToolbarProps {
  /** Graph layer id the section hooks read / write. Default `'graph'`. */
  layerId?: string;
  /** Layout-picker factories. Default a single `d3-force`. */
  layouts?: Record<string, LayoutFactory>;
  /** Labels for the layout picker. */
  layoutLabel?: Record<string, string>;
  /**
   * Apply the initial picked layout on mount. Default `false` — the host app's
   * active layout usually owns the first render; set `true` when using the
   * toolbar standalone so the graph lays out without a manual "Run" click.
   */
  applyInitialLayout?: boolean;
  /**
   * Override the baked icons, by item key. (Selects — layout / select-mode /
   * edge — carry their own per-option icons and aren't overridden here.)
   */
  icons?: Partial<
    Record<
      | 'undo'
      | 'redo'
      | 'run-layout'
      | 'erase'
      | 'fit'
      | 'lock'
      | 'grid',
      ToolbarIcon
    >
  >;
  /** Subtract sections from the variant's default set. */
  sections?: GraphControlsSections;
  /**
   * Extra items appended after the preset sections (divider-separated). Each item
   * carries its own `icon`, so this is also how you bring custom-iconed controls.
   */
  extraItems?: ToolbarItem[] | ((canvas: GraphCanvas | null) => ToolbarItem[]);
  /** Bar orientation. Default `'horizontal'` (header use). */
  orientation?: 'horizontal' | 'vertical';
  /** Class on the `<ToolbarItems>` root. */
  className?: string;
}

// ─── Shared section assembly ──────────────────────────────────────────────────

/**
 * The provider-free control sections (layout · select · style · view · grid) —
 * called by both variants so the common wiring lives in one place. History /
 * edit are added by the full variant only (they need providers + extra hooks).
 * Icons are baked inline on each item.
 */
function useControlSections(props: GraphControlsToolbarProps) {
  const layerId = props.layerId ?? 'graph';
  const layouts = props.layouts ?? DEFAULT_LAYOUTS;
  const layoutLabel = props.layoutLabel ?? DEFAULT_LAYOUT_LABEL;

  const { layout, layoutOptions, applyLayout, isRunning } = useLayout(layouts, {
    layerId,
    labels: layoutLabel,
    initial: Object.keys(layouts)[0],
    applyInitial: props.applyInitialLayout ?? false,
  });
  const { mode, modeOptions, setMode } = useSelectMode(SELECT_MODE_IDS, {
    labels: SELECT_LABEL,
    initial: 'click',
  });
  const style = useStyleEditorSection({ layerId });
  const view = useViewSection({ showZoom: false });
  const { showGrid, toggleGrid } = useGrid();

  return {
    layout: [
      { type: 'select', key: 'layout', label: 'Layout', value: layout, options: layoutOptions, onChange: applyLayout },
      { type: 'button', key: 'run-layout', icon: Play, label: 'Run layout', onClick: () => applyLayout(layout), disabled: isRunning },
    ] as ToolbarItem[],
    select: [
      { type: 'select', key: 'select-mode', label: 'Select', value: mode, options: modeOptions, icons: { click: MousePointer2, brush: SquareDashedMousePointer, lasso: Lasso }, onChange: setMode },
    ] as ToolbarItem[],
    style,
    view,
    grid: [
      { type: 'toggle', key: 'grid', icon: Grid3x3, label: 'Toggle grid', active: showGrid, onToggle: toggleGrid },
    ] as ToolbarItem[],
  };
}

/** Join non-empty groups with dividers (no leading / trailing / doubled dividers). */
function assemble(
  groups: ToolbarItem[][],
  extraItems: GraphControlsToolbarProps['extraItems'],
  canvas: GraphCanvas | null,
): ToolbarItem[] {
  const extra = typeof extraItems === 'function' ? extraItems(canvas) : (extraItems ?? []);
  const all = extra.length ? [...groups, extra] : groups;
  const present = all.filter((g) => g.length > 0);
  return present.flatMap((g, i) => (i === 0 ? g : [{ type: 'divider', key: `d${i}` } as ToolbarItem, ...g]));
}

// ─── Lite variant ─────────────────────────────────────────────────────────────

export function GraphControlsToolbarLite(props: GraphControlsToolbarProps): ReactNode {
  const canvas = useGraphCanvas();
  const c = useControlSections(props);
  const s: Required<Pick<GraphControlsSections, 'layout' | 'selectMode' | 'view' | 'grid'>> = {
    layout: true,
    selectMode: true,
    view: true,
    grid: true,
    ...props.sections,
  };

  const groups: ToolbarItem[][] = [];
  if (s.layout) groups.push(c.layout);
  if (s.selectMode) groups.push(c.select);
  if (s.view) groups.push(c.view);
  if (s.grid) groups.push(c.grid);

  const items = applyIconOverrides(assemble(groups, props.extraItems, canvas), props.icons);
  return <ToolbarItems items={items} orientation={props.orientation ?? 'horizontal'} className={props.className} />;
}

// ─── Full variant ─────────────────────────────────────────────────────────────

/** Inner body — mounted inside the history + clipboard providers the full set needs. */
function GraphControlsToolbarFullBody(props: GraphControlsToolbarProps): ReactNode {
  const canvas = useGraphCanvas();
  const history = useHistorySection();
  const editor = useEditorSection({ items: ['erase'] });
  const c = useControlSections(props);
  const s: Required<GraphControlsSections> = {
    history: true,
    layout: true,
    selectMode: true,
    style: true,
    edit: true,
    view: true,
    grid: true,
    ...props.sections,
  };

  const groups: ToolbarItem[][] = [];
  if (s.history) groups.push(history);
  if (s.layout) groups.push(c.layout);
  if (s.selectMode) groups.push(c.select);
  if (s.style) groups.push(c.style);
  if (s.edit) groups.push(editor);
  if (s.view) groups.push(c.view);
  if (s.grid) groups.push(c.grid);

  const items = applyIconOverrides(assemble(groups, props.extraItems, canvas), props.icons);
  return <ToolbarItems items={items} orientation={props.orientation ?? 'horizontal'} className={props.className} />;
}

export function GraphControlsToolbar(props: GraphControlsToolbarProps): ReactNode {
  const layerId = props.layerId ?? 'graph';
  // The history / edit sections read these providers; mount them around the body.
  return (
    <GraphHistoryProvider layerId={layerId}>
      <GraphClipboardProvider layerId={layerId}>
        <GraphControlsToolbarFullBody {...props} />
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );
}
