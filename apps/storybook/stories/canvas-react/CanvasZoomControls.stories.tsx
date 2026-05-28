/**
 * `<CanvasZoomControls>` — self-wiring zoom overlay with a live `NN%` readout.
 * The readout is driven by `useZoom`'s subscription to `camera:zoom`, so it
 * tracks wheel / pinch / button zoom in real time. Scroll or pinch over the
 * canvas and watch the percentage update.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  D3ForceLayout,
  CanvasZoomControls,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/CanvasZoomControls' };
export default meta;
type Story = StoryObj;

const NODE = {
  style: {
    shape: { kind: 'circle', radius: 8 } as const,
    bgFill: 0x10b981,
    bgStrokeWidth: 1.5,
    bgStrokeColor: 0xffffff,
  },
};
const EDGE = { style: { strokeWidth: 1, strokeColor: 0xcbd5e1, arrowTargetShape: 'none' as const } };

export const LiveZoomLevel: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer patternType="dots" />
        <GraphLayer id="graph" data={lesMiserables} node={NODE} edge={EDGE} />
        <D3ForceLayout targetLayerId="graph" />

        <DragPanBehaviour />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />

        <CanvasZoomControls
          position="bottom-right"
          orientation="horizontal"
          showZoomLevel
          icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut }}
        />
      </Canvas>
    </div>
  ),
};
