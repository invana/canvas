/**
 * Graph data **visualiser** — a read-only explorer built from
 * `@invana/canvas-react` wrappers. Every layer and behaviour is listed directly
 * inside `<Canvas>`; the chrome is five self-wiring toolbars, each pinned to a
 * different edge via its own `<Panel>`. No app state lives in `Visualiser` — the
 * toolbars drive the engine straight from context (and, for history/clipboard,
 * from `<GraphHistoryProvider>` / `<GraphClipboardProvider>`):
 *
 *   - **`<HistoryToolbar>`** (top-left) — undo / redo / redraw via `useHistory`.
 *   - **`<GraphLayoutToolbar>`** (top-centre) — layout switcher (Force / ELK
 *     layered / ELK stress) + selection-mode switcher (Click / Brush / Lasso),
 *     self-wiring through `useLayout` (consumer-supplied factories) and
 *     `useSelectMode` (consumer-supplied behaviour ids). The initial layout is
 *     applied automatically on mount.
 *   - **`<EditToolbar>`** (top-right) — cut / copy / paste / delete selection /
 *     clear canvas, all undoable; reads the selection off the `ClickSelectBehaviour`.
 *   - **`<ViewToolbar>`** (bottom-left) — zoom in/out, zoom-level picker,
 *     fit-to-content, lock view (disables pan + node-drag), all from the camera /
 *     lock hooks.
 *   - **`<GridToolbar>`** (bottom-centre) — toggles the background grid pattern.
 *
 * The minimap sits bottom-right.
 */

import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
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
  PinchZoomBehaviour,
  ViewToolbar,
  WheelZoomBehaviour,
  useCanvas,
  type LayoutFactory,
} from '@invana/canvas-react';
import type { GraphNode, GraphLayer as EngineGraphLayer } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { lesMiserables } from '@invana/graph-datasets';
import {
  ClipboardPaste,
  Copy,
  Eraser,
  Grid3x3,
  Lock,
  LockOpen,
  Maximize,
  Redo2,
  RefreshCw,
  Scissors,
  Trash2,
  Undo2,
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
    }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
  'elk-stress': () => new ElkLayout({ algorithm: 'stress' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

// Mode key → registered behaviour id. `useSelectMode` enables exactly one.
const SELECT_MODE_IDS = { click: 'click-select', brush: 'brush-select', lasso: 'lasso-select' };
const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};

/**
 * Keeps the graph's theme-dependent colours (node labels + borders, edge
 * strokes) in sync with the OS `prefers-color-scheme`.
 *
 * Why imperative: the `<GraphLayer>` wrapper applies its `node`/`edge` style
 * props only at mount, so React-state colour changes wouldn't reach existing
 * nodes. Instead we listen to the media query and call the engine layer's
 * `setNodeDefaults` / `setEdgeDefaults`, which patch the shared template and
 * re-render every node/edge in one pass.
 */
function ThemeController() {
  const canvas = useCanvas();
  useEffect(() => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mq.matches;
      layer.setNodeDefaults({
        labelColor: dark ? 0xe2e8f0 : 0x334155,
        bgStrokeColor: dark ? 0x0f172a : 0xffffff,
      });
      layer.setEdgeDefaults({
        strokeColor: dark ? 0x475569 : 0xcbd5e1,
        arrowTargetColor: dark ? 0x475569 : 0xcbd5e1,
      });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [canvas]);
  return null;
}

function Visualiser() {
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
              // labelColor + bgStrokeColor are theme-driven — see <ThemeController>.
              bgStrokeWidth: 1.5,
              labelText: (n: GraphNode) => String(n.id),
              labelFontSize: 11,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
            },
          }}
          // edge strokeColor is theme-driven — see <ThemeController>.
          edge={{ style: { strokeWidth: 1, arrowTargetShape: 'none' } }}
        />
        <ThemeController />

        {/* Camera + interaction. Pan ('pan') + node-drag ('drag-node') are what
            <ViewToolbar>'s lock disables (default lock behaviour ids). */}
        <DragPanBehaviour />
        <DragNodeBehaviour layerId="graph" />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />
        <HoverActivateBehaviour layerId="graph" degree={1} state="highlighted" />

        {/* Selection behaviours — registered disabled; <GraphLayoutToolbar>'s
            select-mode picker (useSelectMode) enables exactly one. Brush/Lasso
            use `trigger={[]}` so a plain left-drag selects. */}
        <ClickSelectBehaviour layerId="graph" enabled={false} multiple />
        <BrushSelectBehaviour layerId="graph" enabled={false} trigger={[]} />
        <LassoSelectBehaviour layerId="graph" enabled={false} trigger={[]} />

        <LabelResolutionLODBehaviour layerId="graph" />
        <MiniMapLayer graphLayerId="graph" position="bottom-right" margin={{ x: 20 }} />

        {/* History + clipboard need their engine objects over the graph store —
            provided here, consumed by the toolbars below. */}
        <GraphHistoryProvider layerId="graph">
          <GraphClipboardProvider layerId="graph">
            <HistoryToolbar
              position="top-left"
              icons={{ undo: Undo2, redo: Redo2, redraw: RefreshCw }}
            />
            <GraphLayoutToolbar
              position="top-center"
              layouts={LAYOUTS}
              layoutLabels={LAYOUT_LABEL}
              initialLayout="d3-force"
              selectModeBehaviourIds={SELECT_MODE_IDS}
              selectModeLabels={SELECT_LABEL}
              initialSelectMode="click"
            />
            <EditToolbar
              position="top-right"
              icons={{
                cut: Scissors,
                copy: Copy,
                paste: ClipboardPaste,
                delete: Trash2,
                clear: Eraser,
              }}
            />
            <ViewToolbar
              position="bottom-left"
              orientation="vertical"
              icons={{
                zoomIn: ZoomIn,
                zoomOut: ZoomOut,
                fit: Maximize,
                locked: Lock,
                unlocked: LockOpen,
              }}
            />
            <GridToolbar position="bottom-center" icons={{ grid: Grid3x3 }} />
          </GraphClipboardProvider>
        </GraphHistoryProvider>
      </Canvas>
    </div>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
