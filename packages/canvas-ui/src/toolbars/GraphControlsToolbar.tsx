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
 * Both share one core, so they never drift. The controls are **control specs**
 * drawn by `useControlItems` — the same commands a saved control panel runs
 * (`select.mode`, `graph.edgeType`, `history.*`, `graph.erase`, `camera.fit`,
 * `view.lock`, `background.grid`). The factory-based layout picker has no
 * serialisable command, so the toolbar registers two private commands for it
 * while mounted. Extend for the other 20% by
 * toggling sections off (`sections={{ grid: false }}`) or injecting your own
 * items (`extraItems`), where you supply whatever icon you like per item. Need
 * something fully bespoke? Use `<ControlItems>` with your own specs.
 *
 * **Contract:** render where a live engine is resolvable — inside `<Canvas>`, or
 * under a lifted `GraphCanvasContext` whose value is non-null (gate on it). The
 * header apps render the toolbar only once `canvas` exists.
 *
 * Like every toolbar it renders its `<ToolbarItems>` content only, for a header
 * slot; float it with a `<ControlPanel>`. (Supersedes the callback-driven
 * {@link GraphToolbar} for header use.)
 */

import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { ControlItemSpec } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';

import { useGraphCanvas } from '@invana/canvas-react';
import { GraphClipboardProvider, GraphHistoryProvider } from '@invana/canvas-react';
import { type LayoutFactory, useLayout } from '@invana/canvas-react';
import { ToolbarItems, applyIconOverrides, type ToolbarIcon, type ToolbarItem } from '../components';
import { useControlItems } from '../control-panels/ControlItems';
import { eraseSpec, fitSpec, gridSpec, historySpecs, joinGroups, lockSpec } from './controlSpecs';

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
 * The factory-based layout picker + Run/Stop, as **commands private to this
 * toolbar instance** (`toolbar.layout#<id>` / `toolbar.layoutRun#<id>`). Layout
 * factories are closures, so no saved command can carry them; registering them
 * for the toolbar's lifetime keeps the picker on the one spec renderer without
 * writing anything to the canvas definition. The `#` marks a name as private
 * (editors hide such names). Returns the two specs.
 */
function useLayoutSpecs(props: GraphControlsToolbarProps, segmented: boolean): ControlItemSpec[] {
  const canvas = useGraphCanvas();
  const layerId = props.layerId ?? 'graph';
  const layouts = props.layouts ?? DEFAULT_LAYOUTS;
  const layoutLabel = props.layoutLabel ?? DEFAULT_LAYOUT_LABEL;
  const lay = useLayout(layouts, {
    layerId,
    labels: layoutLabel,
    initial: Object.keys(layouts)[0],
    applyInitial: props.applyInitialLayout ?? false,
  });
  const ref = useRef(lay);
  ref.current = lay;

  const uid = useId();
  const pick = `toolbar.layout#${uid}`;
  const toggle = `toolbar.layoutRun#${uid}`;

  useEffect(() => {
    if (!canvas) return;
    const offPick = canvas.commands.register(pick, {
      label: 'Layout',
      value: () => ref.current.layout,
      options: () => Object.entries(ref.current.layoutOptions).map(([value, label]) => ({ value, label })),
      run: (_c, args) => {
        const value = (args as { value?: string } | undefined)?.value;
        if (value) ref.current.applyLayout(value);
      },
    });
    // Engine-agnostic run/stop: while any layout is applying (a live d3-force
    // sim, an async ELK solve, …) the button reads Stop and cancels the run;
    // otherwise it (re-)runs the selected layout.
    const offToggle = canvas.commands.register(toggle, {
      label: 'Run layout',
      isActive: () => ref.current.isRunning,
      run: () => (ref.current.isRunning ? ref.current.stopLayout() : ref.current.applyLayout(ref.current.layout)),
    });
    return () => {
      offPick();
      offToggle();
    };
  }, [canvas, pick, toggle]);

  // The picker state lives in React, not the view store: tell bound controls.
  useEffect(() => {
    canvas?.commands.invalidate();
  }, [canvas, lay.layout, lay.isRunning, lay.layoutOptions]);

  return [
    { type: 'choice', key: 'layout', command: pick, label: 'Layout', ...(segmented ? { display: 'segmented' as const } : {}) },
    { type: 'command', key: 'run-layout', command: toggle, icon: 'play', activeIcon: 'stop', label: 'Run layout', activeLabel: 'Stop layout' },
  ];
}

/** Click / brush / lasso picker (`select.mode`). */
function selectSpecs(segmented: boolean): ControlItemSpec[] {
  return [{ type: 'choice', key: 'select-mode', command: 'select.mode', label: 'Select', ...(segmented ? { display: 'segmented' as const } : {}) }];
}

/** Edge routing (`graph.edgeType`). */
function styleSpecs(layerId: string): ControlItemSpec[] {
  return [{ type: 'choice', key: 'edge-type', command: 'graph.edgeType', args: { layerId }, label: 'Edge' }];
}

/** Draw `specs` plus the host's `extraItems` (their own group) as one bar. */
function useBar(specs: ControlItemSpec[], props: GraphControlsToolbarProps): ReactNode {
  const canvas = useGraphCanvas();
  const items = useControlItems(specs, { canvas });
  const extra = typeof props.extraItems === 'function' ? props.extraItems(canvas) : (props.extraItems ?? []);
  const all: ToolbarItem[] =
    extra.length > 0 ? [...items, ...(items.length > 0 ? [{ type: 'divider', key: 'd-extra' } as ToolbarItem] : []), ...extra] : items;
  return <ToolbarItems items={applyIconOverrides(all, props.icons)} orientation={props.orientation ?? 'horizontal'} className={props.className} />;
}

// ─── Lite variant ─────────────────────────────────────────────────────────────

export function GraphControlsToolbarLite(props: GraphControlsToolbarProps): ReactNode {
  const layerId = props.layerId ?? 'graph';
  const s: Required<Pick<GraphControlsSections, 'layout' | 'selectMode' | 'view' | 'grid'>> = {
    layout: true,
    selectMode: true,
    view: true,
    grid: true,
    ...props.sections,
  };
  const layout = useLayoutSpecs(props, false);

  const specs = joinGroups([
    s.selectMode ? selectSpecs(false) : [],
    s.view ? [fitSpec(layerId), lockSpec()] : [],
    s.grid ? [gridSpec()] : [],
    // Layout picker + run sits at the far right of the bar.
    s.layout ? layout : [],
  ]);
  return useBar(specs, props);
}

// ─── Full variant ─────────────────────────────────────────────────────────────

/** Inner body — mounted inside the history + clipboard providers the full set needs. */
function GraphControlsToolbarFullBody(props: GraphControlsToolbarProps): ReactNode {
  const layerId = props.layerId ?? 'graph';
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
  const layout = useLayoutSpecs(props, true);

  const specs = joinGroups([
    s.history ? historySpecs() : [],
    s.selectMode ? selectSpecs(true) : [],
    s.style ? styleSpecs(layerId) : [],
    s.edit ? [eraseSpec({ icon: 'eraser', layerId })] : [],
    s.view ? [fitSpec(layerId), lockSpec()] : [],
    s.grid ? [gridSpec()] : [],
    // Layout picker + run sits at the far right of the bar.
    s.layout ? layout : [],
  ]);
  return useBar(specs, props);
}

export function GraphControlsToolbar(props: GraphControlsToolbarProps): ReactNode {
  const layerId = props.layerId ?? 'graph';
  // The history / edit commands come from these providers; mount them around the body.
  return (
    <GraphHistoryProvider layerId={layerId}>
      <GraphClipboardProvider layerId={layerId}>
        <GraphControlsToolbarFullBody {...props} />
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );
}
