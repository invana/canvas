/**
 * **Multi-canvas isolation proof.** Two independent `<Canvas>` instances side by
 * side, each with its own `<CanvasControls>`. Because the controls resolve the
 * engine from the instance-scoped
 * `CanvasContext` (and each hook keys its subscription on that instance),
 * zooming / fitting / locking in canvas A must leave canvas B's controls and
 * zoom readout untouched — and vice versa. Drive one side and watch the other
 * stay put.
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  DragNodeBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  D3ForceLayout,
  CanvasControls,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { Lock, LockOpen, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/MultiCanvasControls' };
export default meta;
type Story = StoryObj;

const EDGE = { style: { strokeWidth: 1, strokeColor: 0xcbd5e1, arrowTargetShape: 'none' as const } };
const nodeStyle = (fill: number) => ({
  style: { shape: { kind: 'circle', radius: 8 } as const, bgFill: fill, bgStrokeWidth: 1.5, bgStrokeColor: 0xffffff },
});

const pageStyle: CSSProperties = { display: 'flex', height: '100vh', gap: 1, background: 'var(--color-border)' };
const cellStyle: CSSProperties = { flex: 1, minWidth: 0, position: 'relative' };

/** One self-contained canvas with its own controls and its own lock state. */
function GraphPane({ fill }: { fill: number }) {
  const [locked, setLocked] = useState(false);
  return (
    <div style={cellStyle}>
      <Canvas autoResize>
        <BackgroundLayer patternType="dots" />
        <GraphLayer id="graph" data={lesMiserables} node={nodeStyle(fill)} edge={EDGE} />
        <D3ForceLayout targetLayerId="graph" />

        <DragPanBehaviour enabled={!locked} />
        <DragNodeBehaviour layerId="graph" enabled={!locked} />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />

        <CanvasControls
          icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, locked: Lock, unlocked: LockOpen }}
          locked={locked}
          onToggleLock={() => setLocked((v) => !v)}
        />
      </Canvas>
    </div>
  );
}

export const TwoCanvases: Story = {
  render: () => (
    <div style={pageStyle}>
      <GraphPane fill={0x3b82f6} />
      <GraphPane fill={0xf59e0b} />
    </div>
  ),
};
