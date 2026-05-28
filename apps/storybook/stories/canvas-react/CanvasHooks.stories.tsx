/**
 * Building a **custom** control panel from the canvas hooks (`useZoom`,
 * `useFitContent`, `useCanvasEvent`) + the `<Panel>` / `<ControlButton>`
 * primitives — the "sophisticated panel" path. Everything is pulled from
 * context, so the panel is just a child of `<Canvas>` with no prop wiring; the
 * live zoom % and pan offset prove the event subscriptions.
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  D3ForceLayout,
  Panel,
  ControlButton,
  useZoom,
  useFitContent,
  useCanvasEvent,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { Maximize, Minus, Plus } from 'lucide-react';

const meta: Meta = { title: 'canvas-react/CanvasHooks' };
export default meta;
type Story = StoryObj;

const NODE = {
  style: {
    shape: { kind: 'circle', radius: 8 } as const,
    bgFill: 0x8b5cf6,
    bgStrokeWidth: 1.5,
    bgStrokeColor: 0xffffff,
  },
};
const EDGE = { style: { strokeWidth: 1, strokeColor: 0xcbd5e1, arrowTargetShape: 'none' as const } };

const surfaceStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 10,
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  background: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

/** A bespoke status toolbar wired entirely through hooks — lives inside <Canvas>. */
function CustomPanel() {
  const { zoom, zoomIn, zoomOut } = useZoom();
  const { fitContent, hasContent } = useFitContent('graph');
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Generic event subscription — reflect the live pan offset.
  useCanvasEvent('camera:pan', ({ x, y }) => setPan({ x: Math.round(x), y: Math.round(y) }));

  return (
    <Panel position="top-center" orientation="horizontal">
      <div style={surfaceStyle}>
        <ControlButton icon={Minus} title="Zoom out" onClick={() => zoomOut()} />
        <span style={{ minWidth: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <ControlButton icon={Plus} title="Zoom in" onClick={() => zoomIn()} />
        <span style={{ opacity: 0.6 }}>·</span>
        <span style={{ opacity: 0.8 }}>
          pan {pan.x}, {pan.y}
        </span>
        <ControlButton
          icon={Maximize}
          title="Fit to content"
          disabled={!hasContent}
          onClick={() => fitContent()}
        />
      </div>
    </Panel>
  );
}

export const CustomToolbarFromHooks: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer patternType="dots" />
        <GraphLayer id="graph" data={lesMiserables} node={NODE} edge={EDGE} />
        <D3ForceLayout targetLayerId="graph" />

        <DragPanBehaviour />
        <WheelZoomBehaviour />
        <PinchZoomBehaviour />

        <CustomPanel />
      </Canvas>
    </div>
  ),
};
