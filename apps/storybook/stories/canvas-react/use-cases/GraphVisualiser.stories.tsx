/**
 * Graph data **visualiser** — a read-only explorer built from
 * `@invana/canvas-react` wrappers. Every layer and behaviour is listed directly
 * inside `<Canvas>`; the chrome is **one combined toolbar** pinned top-centre.
 * Each group is a self-wiring toolbar rendered `bare` (its `Nav*` only, no own
 * `<Panel>`); a single shared `<Panel position="top-center" orientation="horizontal">`
 * stacks them side-by-side so they read as one bar of distinct pill-groups. No
 * app state lives in `Visualiser` — the toolbars drive the engine straight from
 * context (and, for history/clipboard, from `<GraphHistoryProvider>` /
 * `<GraphClipboardProvider>`). Left-to-right:
 *
 *   - **`<HistoryToolbar>`** — undo / redo / redraw via `useHistory`.
 *   - **`<GraphLayoutToolbar>`** — layout switcher (Force / ELK layered / ELK
 *     stress) + select-mode switcher (Click / Brush / Lasso), self-wiring
 *     through `useLayout` (consumer-supplied factories) and `useSelectMode`
 *     (consumer-supplied behaviour ids). The initial layout is applied
 *     automatically on mount. Selection is Shift-gated: Shift+click to select
 *     (always on); the switcher arms which Shift+drag gesture is live — Click
 *     (none), Brush, or Lasso. A plain drag always pans.
 *   - **`<EdgeTypePicker>`** — edge routing switcher (straight / orthogonal /
 *     curved / rounded / smooth), self-wiring through `useEdgeType`. Re-routes
 *     every edge at once via the layer's `setEdgeDefaults`.
 *   - **`<EditToolbar>`** — cut / copy / paste / selection-aware erase (delete
 *     selection, or clear the whole canvas when nothing is selected),
 *     all undoable; reads the selection off the `ClickSelectBehaviour`.
 *   - **`<ViewToolbar>`** — zoom in/out, zoom-level picker, fit-to-content, lock
 *     view (disables pan + node-drag), all from the camera / lock hooks. Forced
 *     `orientation="horizontal"` so it lays out along the row.
 *   - **`<GridToolbar>`** — toggles the background grid pattern.
 *
 * The minimap sits bottom-right.
 */

import { useCallback, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  DragNodeBehaviour,
  DragPanBehaviour,
  EdgeTypePicker,
  EditToolbar,
  GraphClipboardProvider,
  GraphHistoryProvider,
  GraphLayer,
  GraphLayoutToolbar,
  GridToolbar,
  HistoryToolbar,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  Panel,
  PinchZoomBehaviour,
  ResponsiveThemeBehaviour,
  ThemeToggle,
  ViewToolbar,
  WheelZoomBehaviour,
  type LayoutFactory,
  type GraphNodeMenuContext,
  type GraphEdgeMenuContext,
  type GraphBackgroundMenuContext,
} from '@invana/canvas-react';
import { Separator, type MenuItem } from '@invana/ui';
import type {
  GraphNode,
  ClickSelectBehaviour as EngineClickSelectBehaviour,
  GraphLayer as EngineGraphLayer,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { lesMiserables } from '@invana/graph-datasets';
import {
  Cable,
  ClipboardPaste,
  CornerDownRight,
  Copy,
  Eraser,
  Grid3x3,
  Lasso,
  Lock,
  LockOpen,
  Maximize,
  Minus,
  Moon,
  MousePointer2,
  Redo2,
  RefreshCw,
  Scissors,
  Spline,
  SquareDashedMousePointer,
  Sun,
  Undo2,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const meta: Meta = { title: 'canvas-react/usecases/GraphVisualiser' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;
type LesMisData = { group: number };
const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

// Layout factories — each call produces a fresh instance. Module-level so the
// reference is stable across renders (keeps `useLayout`'s `applyLayout` stable).
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({
      charge: { strength: -160 },
      link: { distance: 56 },
      collide: { radius: 14 },
      // Snap to the settled layout instead of animating every tick (ELK is
      // already one-shot, so this makes all three layouts apply instantly).
      animate: false,
    }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
  'elk-stress': () => new ElkLayout({ algorithm: 'stress' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

// Select-mode key → registered behaviour id. `useSelectMode` enables exactly
// one entry and disables the rest. Brush and lasso are both Shift+drag, so only
// one can be live. Click-select is always on (Shift+click) and doesn't collide,
// so its `click` entry maps to an empty id: picking it arms NO drag-select
// (Shift+drag does nothing, plain drag pans) without disabling click-select —
// the hook skips ids it can't resolve.
const SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};
// Icon per select mode, shown on the dropdown trigger and beside each option.
const SELECT_ICONS = {
  click: MousePointer2,
  brush: SquareDashedMousePointer,
  lasso: Lasso,
};

// Icon per edge routing type, shown on the <EdgeTypePicker> trigger + options.
// The picker exposes its default set (straight / orthogonal / curved / rounded /
// smooth) and re-routes every edge via the layer's `setEdgeDefaults`.
const EDGE_TYPE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};

/**
 * Flip the `@invana/ui` chrome (toolbar buttons, menus) to match the canvas
 * theme, so the floating controls stay legible against the canvas instead of
 * following the OS independently. Mirrors the storybook's own `bootstrapOsTheme`
 * (`.storybook/preview.ts`), which switches the design-kit by `data-theme`.
 */
function applyChromeTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'default-dark' : 'default-light');
  root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
  root.classList.add(dark ? 'theme-default-dark' : 'theme-default-light', dark ? 'dark' : 'light');
}

/** Whether the OS currently prefers a dark colour scheme. */
function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function Visualiser() {
  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  // Right-click menu item builders for the explorer — one per target, used by
  // the `<Graph*ContextMenu>` components rendered directly in the tree below.
  // The visualiser is read-only, so the actions are **navigation + selection +
  // annotation**, each a single engine method off the `canvas` handed in on
  // `ctx`: `layer.focusNodes/​focusEdges` (zoom), `select.selectNeighbourhood/​
  // selectAll` (selection), `layer.highlightNeighbourhood` +
  // `store.add/clearNodeState` (highlight — interaction state is owned by the
  // store, so toggles go through `layer.store`; the layer renders as a
  // subscriber). Clipboard cut/copy/paste lives in `<EditToolbar>`.

  const nodeItems = useCallback(({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
    return [
      { id: 'zoom', label: 'Zoom to node', onClick: () => layer.focusNodes([id]) },
      { id: 'select', label: 'Select node', onClick: () => select?.select(id, 'shape') },
      {
        id: 'select-hood',
        label: 'Select neighbourhood',
        onClick: () => select?.selectNeighbourhood(id),
      },
      {
        id: 'highlight',
        label: 'Highlight neighbours',
        onClick: () => layer.highlightNeighbourhood(id),
      },
    ];
  }, []);

  const edgeItems = useCallback(({ id, canvas }: GraphEdgeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
    return [
      { id: 'zoom', label: 'Zoom to edge', onClick: () => layer.focusEdges([id]) },
      { id: 'select', label: 'Select edge', onClick: () => select?.select(id, 'connector') },
      {
        id: 'highlight',
        label: 'Highlight edge',
        onClick: () => {
          // One batch → one flush → one paint (§2.5).
          store.batch(() => {
            store.addEdgeState(id, 'highlighted');
            const ed = store.getEdge(id);
            if (ed) {
              store.addNodeState(ed.source, 'highlighted');
              store.addNodeState(ed.target, 'highlighted');
            }
          });
        },
      },
    ];
  }, []);

  const backgroundItems = useCallback(({ canvas }: GraphBackgroundMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
    return [
      { id: 'fit', label: 'Fit to content', onClick: () => canvas.camera.fitContent(layer.getBounds(), 80) },
      { id: 'select-all', label: 'Select all', shortcut: '⌘A', onClick: () => select?.selectAll() },
      { id: 'clear-sel', label: 'Clear selection', onClick: () => select?.clearSelection() },
      {
        id: 'clear-hl',
        label: 'Clear highlights',
        onClick: () => {
          store.clearNodeState('highlighted');
          store.clearEdgeState('highlighted');
        },
      },
    ];
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <Canvas autoResize>
        {/* A grid pattern so <GridToolbar> has something to toggle. The
            `{ light, dark }` pairs follow the OS `prefers-color-scheme`. */}
        <BackgroundLayer
          type="pattern"
          patternType="grid"
          backgroundColor={{ light: '#f8fafc', dark: '#0f172a' }}
          color={{ light: '#94a3b8', dark: '#334155' }}
        />
        <GraphLayer
          id="graph"
          data={lesMiserables}
          node={{
            style: {
              shape: { kind: 'circle', radius: 8 },
              bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]!,
              // labelColor + bgStrokeColor are theme-driven — see <ResponsiveThemeBehaviour>.
              bgStrokeWidth: 1.5,
              labelText: (n: GraphNode) => String(n.id),
              labelFontSize: 11,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
            },
          }}
          // edge strokeColor is theme-driven — see <ResponsiveThemeBehaviour>.
          edge={{ style: { strokeWidth: 1, arrowTargetShape: 'none' } }}
        />
        {/* Themes node labels + borders and edge strokes/arrows to the OS
            `prefers-color-scheme`. */}
        <ResponsiveThemeBehaviour
          layerId="graph"
          node={{
            light: { labelColor: 0x334155, bgStrokeColor: 0xffffff },
            dark: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a },
          }}
          edge={{
            light: { strokeColor: 0xcbd5e1, arrowTargetColor: 0xcbd5e1 },
            dark: { strokeColor: 0x475569, arrowTargetColor: 0x475569 },
          }}
        />

        {/* Camera + interaction. Pan ('pan') + node-drag ('drag-node') are what
            <ViewToolbar>'s lock disables (default lock behaviour ids). */}
        <DragPanBehaviour />
        <DragNodeBehaviour layerId="graph" />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />
        <HoverActivateBehaviour layerId="graph" degree={1} state="highlighted" />

        {/* Selection — Shift is the trigger for all three. Shift+click selects
            (click-select stays on); Shift+drag brushes or lassos. A plain drag
            stays a pure pan. Click and the drag-selects don't collide (click vs
            drag), but brush and lasso are both Shift+drag, so <GraphLayoutToolbar>'s
            select-mode picker (useSelectMode) enables exactly one of them. */}
        <ClickSelectBehaviour layerId="graph" enabled multiple />
        <BrushSelectBehaviour layerId="graph" enabled={false} />
        <LassoSelectBehaviour layerId="graph" enabled={false} />

        <LabelResolutionLODBehaviour layerId="graph" />
        <MiniMapLayer graphLayerId="graph" position="bottom-right" margin={{ x: 20 }} />

        {/* History + clipboard need their engine objects over the graph store —
            provided here, consumed by the toolbars below. */}
        {/* One combined toolbar: every group's bare toolbar (Nav only, no
            <Panel>) stacked side-by-side inside a single top-centre <Panel>, so
            they read as one bar of distinct pill-groups. */}
        <GraphHistoryProvider layerId="graph">
          <GraphClipboardProvider layerId="graph">
            <Panel position="top-center" orientation="horizontal" gap={12}>
              <HistoryToolbar bare icons={{ undo: Undo2, redo: Redo2, redraw: RefreshCw }} />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <GraphLayoutToolbar
                bare
                layouts={LAYOUTS}
                layoutLabels={LAYOUT_LABEL}
                initialLayout="d3-force"
                selectModeBehaviourIds={SELECT_MODE_IDS}
                selectModeLabels={SELECT_LABEL}
                selectModeIcons={SELECT_ICONS}
                initialSelectMode="click"
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* Edge routing picker — self-wires to the 'graph' layer and
                  re-routes every edge (straight / orthogonal / curved / …). */}
              <EdgeTypePicker layerId="graph" icons={EDGE_TYPE_ICONS} />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <EditToolbar
                bare
                icons={{
                  cut: Scissors,
                  copy: Copy,
                  paste: ClipboardPaste,
                  clear: Eraser,
                }}
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* ViewToolbar defaults to vertical — force horizontal for the row. */}
              <ViewToolbar
                bare
                orientation="horizontal"
                icons={{
                  zoomIn: ZoomIn,
                  zoomOut: ZoomOut,
                  fit: Maximize,
                  locked: Lock,
                  unlocked: LockOpen,
                }}
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <GridToolbar bare icons={{ grid: Grid3x3 }} />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* Switch the graph theme (drives <ResponsiveThemeBehaviour>) to test
                  the light/dark styling without changing the OS appearance. Flips
                  the background layer in lockstep so the whole canvas stays
                  coherent (otherwise light-on-light labels look invisible). */}
              <ThemeToggle
                lightIcon={Sun}
                darkIcon={Moon}
                backgroundLayerId="background"
                onChange={(kind) => applyChromeTheme(kind === 'dark')}
              />
            </Panel>
            {/* Right-click menus — one component per target, each owning its own
                behaviour + overlay + dismissal. Builders defined in `Visualiser`. */}
            <GraphNodeContextMenu items={nodeItems} />
            <GraphEdgeContextMenu items={edgeItems} />
            <GraphBackgroundContextMenu items={backgroundItems} />
          </GraphClipboardProvider>
        </GraphHistoryProvider>
      </Canvas>
    </div>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
