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
 *   - **`<EditToolbar>`** — cut / copy / paste / delete selection / clear canvas,
 *     all undoable; reads the selection off the `ClickSelectBehaviour`.
 *   - **`<ViewToolbar>`** — zoom in/out, zoom-level picker, fit-to-content, lock
 *     view (disables pan + node-drag), all from the camera / lock hooks. Forced
 *     `orientation="horizontal"` so it lays out along the row.
 *   - **`<GridToolbar>`** — toggles the background grid pattern.
 *
 * The minimap sits bottom-right.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  ContextMenuBehaviour,
  ContextMenuOverlay,
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
  useCamera,
  useCanvas,
  useClipboard,
  useContextMenu,
  useFitContent,
  useSelection,
  type LayoutFactory,
} from '@invana/canvas-react';
import { Separator, type MenuItem } from '@invana/ui';
import type {
  GraphNode,
  ContextMenuEvent,
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
  Trash2,
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

/**
 * Right-click context menus for the explorer — node / edge / empty-canvas. The
 * visualiser is read-only, so the actions are **navigation + selection +
 * annotation** (no graph mutations beyond the existing clipboard), wired through
 * the explorer's hooks:
 *
 *   - **Node** — Zoom to node (`useCamera.fitContent`), Select node, Select
 *     neighbourhood (`selectMultiple` over `store.neighborsOf` + incident edges),
 *     Highlight neighbours (`layer.setNodeState('highlighted')`).
 *   - **Edge** — Zoom to edge, Select edge, Highlight edge + endpoints.
 *   - **Canvas** — Fit to content (`useFitContent`), Select all, Clear selection
 *     (`useSelection`), Clear highlights, Copy selection + Paste (`useClipboard`).
 *
 * Lives inside `<GraphClipboardProvider>` (so `useClipboard` resolves) and inside
 * `<Canvas>` (host is `position: relative`) so the overlay anchors at the cursor.
 */
function VisualiserContextMenu() {
  const canvas = useCanvas();
  const camera = useCamera();
  const { fitContent } = useFitContent('graph');
  const { copy, paste, canPaste } = useClipboard();
  const { clear: clearSelection } = useSelection();
  const { menu, open, close } = useContextMenu<MenuItem[]>();
  // Ids currently carrying the transient 'highlighted' state, so "Clear
  // highlights" can revert exactly what these menus lit (and nothing else).
  const litRef = useRef<{ nodes: Set<string>; edges: Set<string> }>({
    nodes: new Set(),
    edges: new Set(),
  });

  const onContextMenu = useCallback(
    (e: ContextMenuEvent): void => {
      const layer = canvas.layers.get<EngineGraphLayer>('graph');
      if (!layer) return;
      const store = layer.store;
      const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
      const lit = litRef.current;

      const highlightNode = (id: string): void => {
        layer.setNodeState(id, 'highlighted', true);
        lit.nodes.add(id);
      };
      const highlightEdge = (id: string): void => {
        layer.setEdgeState(id, 'highlighted', true);
        lit.edges.add(id);
      };
      const clearHighlights = (): void => {
        for (const id of lit.nodes) layer.setNodeState(id, 'highlighted', false);
        for (const id of lit.edges) layer.setEdgeState(id, 'highlighted', false);
        lit.nodes.clear();
        lit.edges.clear();
      };
      // Frame the camera on a world rect spanning the given points (+ padding).
      const zoomTo = (pts: Array<{ x: number; y: number }>): void => {
        if (!pts.length) return;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of pts) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        camera.fitContent(
          { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) },
          160,
        );
      };

      let items: MenuItem[];
      if (e.targetType === 'node' && e.id) {
        const id = e.id;
        items = [
          {
            id: 'zoom',
            label: 'Zoom to node',
            onClick: () => {
              const n = store.getNode(id);
              if (n?.position) zoomTo([n.position]);
              close();
            },
          },
          { id: 'select', label: 'Select node', onClick: () => { select?.select(id, 'shape'); close(); } },
          {
            id: 'select-hood',
            label: 'Select neighbourhood',
            onClick: () => {
              const els: Array<{ id: string; type: 'shape' | 'connector' }> = [{ id, type: 'shape' }];
              for (const nb of store.neighborsOf(id, 'both')) els.push({ id: nb, type: 'shape' });
              for (const ed of store.edgesOf(id, 'both')) els.push({ id: ed.id, type: 'connector' });
              select?.selectMultiple(els);
              close();
            },
          },
          {
            id: 'highlight',
            label: 'Highlight neighbours',
            onClick: () => {
              highlightNode(id);
              for (const nb of store.neighborsOf(id, 'both')) highlightNode(nb);
              for (const ed of store.edgesOf(id, 'both')) highlightEdge(ed.id);
              close();
            },
          },
        ];
      } else if (e.targetType === 'edge' && e.id) {
        const id = e.id;
        items = [
          {
            id: 'zoom',
            label: 'Zoom to edge',
            onClick: () => {
              const ed = store.getEdge(id);
              const pts = [ed && store.getNode(ed.source)?.position, ed && store.getNode(ed.target)?.position];
              zoomTo(pts.filter(Boolean) as Array<{ x: number; y: number }>);
              close();
            },
          },
          { id: 'select', label: 'Select edge', onClick: () => { select?.select(id, 'connector'); close(); } },
          {
            id: 'highlight',
            label: 'Highlight edge',
            onClick: () => {
              highlightEdge(id);
              const ed = store.getEdge(id);
              if (ed) {
                highlightNode(ed.source);
                highlightNode(ed.target);
              }
              close();
            },
          },
        ];
      } else {
        items = [
          { id: 'fit', label: 'Fit to content', onClick: () => { fitContent(); close(); } },
          {
            id: 'select-all',
            label: 'Select all',
            shortcut: '⌘A',
            onClick: () => {
              const els: Array<{ id: string; type: 'shape' | 'connector' }> = [];
              for (const n of store.nodes()) els.push({ id: n.id, type: 'shape' });
              for (const ed of store.edges()) els.push({ id: ed.id, type: 'connector' });
              select?.selectMultiple(els);
              close();
            },
          },
          { id: 'clear-sel', label: 'Clear selection', onClick: () => { clearSelection(); close(); } },
          { id: 'clear-hl', label: 'Clear highlights', onClick: () => { clearHighlights(); close(); } },
          { id: 'copy', label: 'Copy selection', shortcut: '⌘C', onClick: () => { copy(); close(); } },
        ];
        if (canPaste) {
          items.push({ id: 'paste', label: 'Paste', shortcut: '⌘V', onClick: () => { paste(); close(); } });
        }
      }

      open(e.screen.x, e.screen.y, items);
    },
    [canvas, camera, fitContent, copy, paste, canPaste, clearSelection, open, close],
  );

  return (
    <>
      <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
      {menu && <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} />}
    </>
  );
}

function Visualiser() {
  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);
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
                  delete: Trash2,
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
            <VisualiserContextMenu />
          </GraphClipboardProvider>
        </GraphHistoryProvider>
      </Canvas>
    </div>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
