/**
 * Graph data **visualiser** — a read-only explorer built entirely from
 * `@invana/canvas-react` wrappers:
 *
 *   - dotted background, force-laid-out `lesMiserables`, pan / zoom / pinch
 *   - drag nodes, hover to highlight 1-hop neighbours (dim the rest)
 *   - click-select (multi, 1-hop) with a live selection count
 *   - zoom-tier label LOD, toggleable minimap
 *   - an `@invana/ui` control panel (Fit / Re-run layout / minimap toggle)
 *
 * The panel is a `<Canvas>` child so it can reach the live engine via
 * `useCanvas()`. No `play` / teardown — `<Canvas>` cleans up on unmount.
 */

import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  ClickSelectBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  MiniMapLayer,
  PinchZoomBehaviour,
  WheelZoomBehaviour,
  useCanvas,
} from '@invana/canvas-react';
import type { GraphNode, GraphLayer as EngineGraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Button, Card, Separator } from '@invana/ui';

const meta: Meta = { title: 'canvas-react/GraphVisualiser' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

type LesMisData = { group: number };
const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

/** Floating control panel — lives inside <Canvas>, so `useCanvas()` is live. */
function VisualiserPanel(props: {
  selection: number;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onRerunLayout: () => void;
}) {
  const canvas = useCanvas();
  const fit = useCallback(() => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (layer) canvas.camera.fitContent(layer.getBounds(), 80);
  }, [canvas]);

  return (
    <Card
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 200,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>Visualiser</div>
      <Separator />
      <Button variant="outline" size="sm" onClick={fit}>
        Fit to content
      </Button>
      <Button variant="outline" size="sm" onClick={props.onRerunLayout}>
        Re-run layout
      </Button>
      <Button variant={props.showMinimap ? 'default' : 'outline'} size="sm" onClick={props.onToggleMinimap}>
        {props.showMinimap ? 'Hide minimap' : 'Show minimap'}
      </Button>
      <Separator />
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {lesMiserables.nodes.length} nodes · {lesMiserables.edges.length} edges
      </div>
      <div style={{ fontSize: 12 }}>Selected: {props.selection}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        Hover to highlight neighbours · click to select · shift-click to add
      </div>
    </Card>
  );
}

function Visualiser() {
  const [layoutKey, setLayoutKey] = useState(0);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selection, setSelection] = useState(0);

  return (
    <Canvas autoResize style={{ position: 'relative', width: '100%', height: '100vh' }}>
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
      <D3ForceLayout
        key={layoutKey}
        targetLayerId="graph"
        options={{ charge: { strength: -160 }, link: { distance: 56 }, collide: { radius: 14 } }}
      />

      <DragPanBehaviour />
      <WheelZoomBehaviour />
      <PinchZoomBehaviour />
      <DragNodeBehaviour layerId="graph" />
      <HoverActivateBehaviour
        layerId="graph"
        degree={1}
        state="highlighted"
        inactiveState="dimmed"
      />
      <ClickSelectBehaviour
        layerId="graph"
        multiple
        degree={1}
        state="selected"
        onSelectionChange={({ shapeIds }) => setSelection(shapeIds.length)}
      />
      <LabelResolutionLODBehaviour layerId="graph" />

      {showMinimap && <MiniMapLayer graphLayerId="graph" />}

      <VisualiserPanel
        selection={selection}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((v) => !v)}
        onRerunLayout={() => setLayoutKey((k) => k + 1)}
      />
    </Canvas>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
