/**
 * **`GroupFramesLayer` under load** — 5,000 nodes and ten frames of fifty
 * members each, while the layout animates them. The readout is the layer's own
 * time per frame (mean and worst over the last second) beside the canvas's
 * frame rate.
 *
 * | Do | What to read |
 * |---|---|
 * | *Run the layout* | every node moves every frame; the layer's mean stays well under a millisecond |
 * | leave it settled | the layer does no work: the graph's version is unchanged |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { useGraphCanvas } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { GroupFramesLayer } from '@invana/graph';
import { generateRandomTree } from '@invana/graph-datasets';
import { Button, Eyebrow } from '@invana/ui';

const meta: Meta = { title: 'graph/Layer/GroupFramesPerf' };
export default meta;
type Story = StoryObj;

const N = 5000;
const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };
const COLORS = [0x2563eb, 0xd97706, 0x16a34a, 0xdc2626, 0x7c3aed];

function Frames() {
  const canvas = useGraphCanvas();
  const [readout, setReadout] = useState('');
  useEffect(() => {
    const frames = new GroupFramesLayer({ id: 'frames', zIndex: -1, options: { graphLayerId: 'graph' } });
    canvas.layers.add(frames);
    frames.setFrames(
      Array.from({ length: 10 }, (_, f) => ({
        id: `f${f}`,
        // Fifty members spread across the tree, so every frame moves with the layout.
        members: Array.from({ length: 50 }, (_, m) => String(1 + ((f * 50 + m) * 97) % (N - 1))),
        label: `Frame ${f + 1} · 50 records`,
        color: COLORS[f % COLORS.length]!,
      })),
    );
    // Time the layer's own work each frame.
    const samples: number[] = [];
    const tick = frames.tickAnimations.bind(frames);
    frames.tickAnimations = (dt: number) => {
      const t0 = performance.now();
      tick(dt);
      samples.push(performance.now() - t0);
      if (samples.length > 120) samples.shift();
    };
    const timer = window.setInterval(() => {
      const mean = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
      const worst = Math.max(0, ...samples);
      setReadout(`layer ${mean.toFixed(3)} ms mean · ${worst.toFixed(2)} ms worst · ${Math.round(canvas.frames.stats().fps)} fps`);
    }, 1000);
    return () => {
      window.clearInterval(timer);
      canvas.layers.remove('frames');
    };
  }, [canvas]);
  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
      <Button
        onClick={() => {
          const id = canvas.get().activeLayout;
          if (id) void canvas.runLayout(id);
        }}
      >
        Run the layout
      </Button>
      <Eyebrow data-testid="frames-readout">{readout}</Eyebrow>
    </div>
  );
}

export const GroupFramesPerfStory: Story = {
  name: 'GroupFramesPerf',
  render: function Render() {
    const data = useMemo(() => generateRandomTree(N), []);
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'GroupFramesPerf' }}>
        <Frames />
      </GraphCanvasApp>
    );
  },
};
