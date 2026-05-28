/**
 * Graph data **visualiser** — a read-only explorer built from
 * `@invana/canvas-react` wrappers, with two `@invana/canvas-ui` toolbars:
 *
 *   - **`<GraphToolbar>`** (top) — layout switcher (Force / ELK layered / ELK
 *     stress), selection-mode dropdown (Click / Brush / Lasso; Click default),
 *     and Clear canvas.
 *   - **`<GraphViewControls>`** (left) — zoom in / out, show-minimap toggle, and
 *     lock-view (disables pan + node-drag).
 *
 * The toolbars are engine-agnostic (props + callbacks); this story supplies the
 * lucide icons and wires the callbacks to the engine via a `ref` (zoom, clear)
 * and React state (layout, select mode, minimap, lock).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
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
import { GraphToolbar, GraphViewControls } from '@invana/canvas-ui';
import { Lock, LockOpen, Map, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/GraphVisualiser' };
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

function Visualiser() {
  const canvasRef = useRef<EngineCanvas>(null);
  const [layout, setLayout] = useState<LayoutName>('d3-force');
  const [selectMode, setSelectMode] = useState<SelectMode>('click');
  const [showMinimap, setShowMinimap] = useState(true);
  const [locked, setLocked] = useState(false);

  const zoomIn = useCallback(() => canvasRef.current?.camera.zoomAt(1.2), []);
  const zoomOut = useCallback(() => canvasRef.current?.camera.zoomAt(1 / 1.2), []);
  const clear = useCallback(() => {
    canvasRef.current?.layers.get<EngineGraphLayer>('graph')?.store.clear();
  }, []);

  return (
    <div style={pageStyle}>
      <GraphToolbar
        layout={layout}
        layoutOptions={LAYOUT_LABEL}
        onLayoutChange={(v) => setLayout(v as LayoutName)}
        selectMode={selectMode}
        selectModeOptions={SELECT_LABEL}
        onSelectModeChange={(v) => setSelectMode(v as SelectMode)}
        onClear={clear}
        clearIcon={Trash2}
      />

      <div style={bodyStyle}>
        <GraphViewControls
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          zoomInIcon={ZoomIn}
          zoomOutIcon={ZoomOut}
          minimapActive={showMinimap}
          onToggleMinimap={() => setShowMinimap((v) => !v)}
          minimapIcon={Map}
          locked={locked}
          onToggleLock={() => setLocked((v) => !v)}
          lockedIcon={Lock}
          unlockedIcon={LockOpen}
        />

        <div style={hostStyle}>
          <Canvas ref={canvasRef} autoResize>
            <BackgroundLayer patternType="dots" />
            <GraphLayer
              id="graph"
              data={lesMiserables}
              node={{
                style: {
                  shape: { kind: 'circle', radius: 8 },
                  bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]!,
                  bgStrokeColor: 0xffffff,
                  bgStrokeWidth: 1.5,
                  labelText: (n: GraphNode) => String(n.id),
                  labelColor: 0x334155,
                  labelFontSize: 11,
                  labelPlacement: 'bottom',
                  labelOffsetY: 4,
                },
              }}
              edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } }}
            />
            <LayoutController name={layout} />

            {/* Lock view disables pan + node-drag; zoom stays available. */}
            <DragPanBehaviour enabled={!locked} />
            <DragNodeBehaviour layerId="graph" enabled={!locked} />
            <WheelZoomBehaviour />
            <PinchZoomBehaviour />
            <HoverActivateBehaviour
              layerId="graph"
              degree={1}
              state="highlighted"
              inactiveState="dimmed"
            />

            {/* Selection mode — exactly one enabled at a time. */}
            <ClickSelectBehaviour layerId="graph" enabled={selectMode === 'click'} multiple degree={1} />
            <BrushSelectBehaviour layerId="graph" enabled={selectMode === 'brush'} />
            <LassoSelectBehaviour layerId="graph" enabled={selectMode === 'lasso'} />

            <LabelResolutionLODBehaviour layerId="graph" />
            {showMinimap && <MiniMapLayer graphLayerId="graph" />}
          </Canvas>
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh' };
const bodyStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex' };
const hostStyle: CSSProperties = { flex: 1, minWidth: 0, position: 'relative' };

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
