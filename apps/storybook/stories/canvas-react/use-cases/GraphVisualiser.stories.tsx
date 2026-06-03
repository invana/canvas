/**
 * Graph data **visualiser** — a read-only explorer built from
 * `@invana/canvas-react` wrappers. Every layer, behaviour, and overlay is listed
 * directly inside `<Canvas>`. App state (layout / select mode / minimap / lock)
 * lives in `Visualiser` and is passed to the children as props; the only
 * engine-dependent action, Clear, goes through the `<Canvas>` ref. Two overlays
 * self-position via `<Panel>`:
 *
 *   - **`<GraphToolbar>`** (top-centre, `@invana/canvas-react`) — layout switcher
 *     (Force / ELK layered / ELK stress), selection-mode dropdown (Click / Brush
 *     / Lasso; Click default), and Clear canvas (wired to `GraphLayer.clear()`).
 *   - **`<CanvasControls>`** (bottom-left, `@invana/canvas-react`) — the single
 *     self-wiring view rail: zoom in / out + fit-to-content come from the camera
 *     hooks for free (no wiring); the minimap toggle is a `<ControlButton>` child
 *     and lock-view (disables pan + node-drag) is the controlled lock. The minimap
 *     sits just to its right (also bottom-left).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  CanvasControls,
  ClickSelectBehaviour,
  ControlButton,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  GraphToolbar,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  PinchZoomBehaviour,
  WheelZoomBehaviour,
  useCanvas,
} from '@invana/canvas-react';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { GraphNode, GraphLayer as EngineGraphLayer } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { lesMiserables } from '@invana/graph-datasets';
import { Lock, LockOpen, Maximize, Map, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/usecases/GraphVisualiser' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;
type LesMisData = { group: number };
const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

type LayoutName = 'd3-force' | 'elk-layered' | 'elk-stress';
const LAYOUT_LABEL: Record<LayoutName, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

type SelectMode = 'click' | 'brush' | 'lasso';
const SELECT_LABEL: Record<SelectMode, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};

/** Applies the chosen layout imperatively and re-fits; re-runs on change. */
function LayoutController({ name }: { name: LayoutName }) {
  const canvas = useCanvas();
  useEffect(() => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return;
    let cancelled = false;
    const layout =
      name === 'd3-force'
        ? new D3ForceLayout({
            charge: { strength: -160 },
            link: { distance: 56 },
            collide: { radius: 14 },
          })
        : name === 'elk-layered'
          ? new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' })
          : new ElkLayout({ algorithm: 'stress' });
    void layout.apply(layer).then(() => {
      if (!cancelled) canvas.camera.fitContent(layer.getBounds(), 80);
    });
    return () => {
      cancelled = true;
      (layout as { stop?: () => void }).stop?.();
    };
  }, [canvas, name]);
  return null;
}

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
  const canvasRef = useRef<EngineCanvas>(null);
  const [layout, setLayout] = useState<LayoutName>('d3-force');
  const [selectMode, setSelectMode] = useState<SelectMode>('click');
  const [showMinimap, setShowMinimap] = useState(true);
  const [locked, setLocked] = useState(false);

  // The only engine-dependent action: `GraphLayer.clear()` tears down the
  // rendered shapes + store and notifies dependent layers (minimap) — unlike the
  // silent low-level `store.clear()`. Read the engine off the ref at call time;
  // it's initialised by the time any toolbar button can be clicked. Zoom / fit /
  // lock need no ref — `<CanvasControls>` self-wires them from context.
  const clear = useCallback(
    () => canvasRef.current?.layers.get<EngineGraphLayer>('graph')?.clear(),
    [],
  );

  return (
    <div style={{ height: '100vh' }}>
      <Canvas ref={canvasRef} autoResize>
        {/* mode defaults to 'auto' → fill + dot pattern follow the OS
            `prefers-color-scheme`. The `{ light, dark }` pairs give the layer an
            actual dark variant to paint. */}
        <BackgroundLayer
          patternType="dots"
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
        <LayoutController name={layout} />
        <ThemeController />

        {/* Lock view disables pan + node-drag; zoom stays available. */}
        <DragPanBehaviour enabled={!locked} />
        <DragNodeBehaviour layerId="graph" enabled={!locked} />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />
        <HoverActivateBehaviour layerId="graph" degree={1} state="highlighted" />

        {/* Selection mode — exactly one enabled at a time. Brush/Lasso default
            to `trigger: ['shift']` (shift+drag); since selection mode is an
            explicit switch here, `trigger={[]}` lets a plain left-drag select.
            They pause camera pan on pointerdown, so they coexist with DragPan. */}
        <ClickSelectBehaviour layerId="graph" enabled={selectMode === 'click'} multiple />
        <BrushSelectBehaviour layerId="graph" enabled={selectMode === 'brush'} trigger={[]} />
        <LassoSelectBehaviour layerId="graph" enabled={selectMode === 'lasso'} trigger={[]} />

        <LabelResolutionLODBehaviour layerId="graph" />
        {/* Minimap sits bottom-left, just right of the view rail and bottom-aligned
            with it: x clears the rail's width, y matches the rail's 8px Panel offset. */}
        {showMinimap && (
          <MiniMapLayer graphLayerId="graph" position="bottom-left" margin={{ x: 64, y: 17 }} />
        )}

        {/* Top-centre toolbar — a turnkey canvas-react toolbar; Clear wired to
            the graph layer via the canvas ref. Self-positions via its own <Panel>. */}
        <GraphToolbar
          layout={layout}
          layoutOptions={LAYOUT_LABEL}
          onLayoutChange={(v) => setLayout(v as LayoutName)}
          selectMode={selectMode}
          selectModeOptions={SELECT_LABEL}
          onSelectModeChange={(v) => setSelectMode(v as SelectMode)}
          onClear={clear}
          clearIcon={Trash2}
          position="top-center"
        />

        {/* Bottom-left view rail — ONE self-wiring component. Zoom +/- and fit
            come from the camera hooks with no wiring; the minimap toggle is a
            <ControlButton> child; lock is the controlled toggle. */}
        <CanvasControls
          position="bottom-left"
          icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, locked: Lock, unlocked: LockOpen }}
          locked={locked}
          onToggleLock={() => setLocked((v) => !v)}
        >
          <ControlButton
            icon={Map}
            title="Toggle minimap"
            active={showMinimap}
            onClick={() => setShowMinimap((v) => !v)}
          />
        </CanvasControls>
      </Canvas>
    </div>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
