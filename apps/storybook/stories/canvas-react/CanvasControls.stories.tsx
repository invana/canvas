/**
 * `<CanvasControls>` — the self-wiring controls overlay (canvas equivalent of
 * React Flow's `<Controls>`). Dropped inside `<Canvas>` it pulls the camera from
 * context, so zoom + fit work with **only an `icons` prop** — no callback
 * wiring. This story also shows the controlled lock toggle and an extra
 * `<ControlButton>` child (built on `useZoom`) appended after the presets.
 */

import { useState } from 'react';
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
  ControlButton,
  useZoom,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { Lock, LockOpen, Maximize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/CanvasControls' };
export default meta;
type Story = StoryObj;

const NODE = {
  style: {
    shape: { kind: 'circle', radius: 8 } as const,
    bgFill: 0x3b82f6,
    bgStrokeWidth: 1.5,
    bgStrokeColor: 0xffffff,
  },
};
const EDGE = { style: { strokeWidth: 1, strokeColor: 0xcbd5e1, arrowTargetShape: 'none' as const } };

/** Extra control built on a hook — resets zoom to 100%. Lives inside <Canvas>, so context is available. */
function ResetZoomButton() {
  const { setZoom } = useZoom();
  return <ControlButton icon={RotateCcw} title="Reset zoom (100%)" onClick={() => setZoom(1)} />;
}

function Demo() {
  const [locked, setLocked] = useState(false);
  return (
    <div style={{ height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer patternType="dots" />
        <GraphLayer id="graph" data={lesMiserables} node={NODE} edge={EDGE} />
        <D3ForceLayout targetLayerId="graph" />

        <DragPanBehaviour enabled={!locked} />
        <DragNodeBehaviour layerId="graph" enabled={!locked} />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />

        <CanvasControls
          icons={{
            zoomIn: ZoomIn,
            zoomOut: ZoomOut,
            fit: Maximize,
            locked: Lock,
            unlocked: LockOpen,
          }}
          locked={locked}
          onToggleLock={() => setLocked((v) => !v)}
        >
          <ResetZoomButton />
        </CanvasControls>
      </Canvas>
    </div>
  );
}

export const WithLockAndExtra: Story = {
  render: () => <Demo />,
};
