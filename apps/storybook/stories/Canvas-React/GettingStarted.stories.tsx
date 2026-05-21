/**
 * Smallest end-to-end React surface for the engine.
 *
 * Mounts a `<Canvas>` with three children — two behaviours, one graph layer,
 * one layout — and that's the whole story. The React tree drives setup; the
 * `<Canvas>`'s effect cleanup calls `canvas.destroy()` on unmount, so no
 * `onStoryTeardown` is needed.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  GraphLayer,
  D3ForceLayout,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import type { GraphNode } from '@invana/graph';

const meta: Meta = { title: 'Canvas-React/GettingStarted' };
export default meta;
type Story = StoryObj;

const GROUP_COLORS = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
  0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
] as const;

type LesMisNodeData = { group: number };

export const GettingStarted: Story = {
  render: () => (
    <Canvas autoResize>
      <DragPanBehaviour />
      <WheelZoomBehaviour />
      <GraphLayer
        id="graph"
        data={lesMiserables}
        node={{
          style: {
            shape: { kind: 'circle', radius: 5 },
            bgFill: (n: GraphNode) =>
              GROUP_COLORS[(n.data as LesMisNodeData).group % GROUP_COLORS.length]!,
          },
        }}
        edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } }}
      />
      <D3ForceLayout
        targetLayerId="graph"
        options={{ link: {}, charge: {}, center: { x: 0, y: 0 } }}
      />
    </Canvas>
  ),
};
