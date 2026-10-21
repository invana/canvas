/**
 * **`GroupFramesLayer` — frames round sets of nodes, painted under the graph.**
 * A frame is not a node: it never parents its members, a layout never places
 * it, and an export never carries it. It is read off its members' places every
 * frame the graph changes.
 *
 * | Do | What happens |
 * |---|---|
 * | drag a member | its frame follows it |
 * | *Run the layout* | the members move; each frame follows them |
 * | click a frame's header | `frame:click` — the last one shows under the button |
 *
 * An annotation's group is drawn this way.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { useGraphCanvas } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { type GraphData, GroupFramesLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Button, Eyebrow } from '@invana/ui';

const meta: Meta = { title: 'graph/Layer/GroupFrames' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };
const IDS = new Set(['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Eponine', 'Thenardier', 'Gavroche', 'Enjolras', 'Combeferre']);

function Frames() {
  const canvas = useGraphCanvas();
  const [clicked, setClicked] = useState<string | null>(null);
  useEffect(() => {
    const frames = new GroupFramesLayer({ id: 'frames', zIndex: -1, options: { graphLayerId: 'graph' } });
    canvas.layers.add(frames);
    frames.setFrames([
      { id: 'plumet', members: ['Cosette', 'Marius', 'Eponine'], label: 'Rue Plumet · 3 records', color: 0x2563eb },
      { id: 'barricade', members: ['Enjolras', 'Combeferre', 'Gavroche', 'Marius'], label: 'The barricade · 4 of 5 records', color: 0xd97706, dashed: true },
    ]);
    const off = frames.events.on('frame:click', ({ frameId }) => setClicked(frameId));
    return () => {
      off();
      canvas.layers.remove('frames');
    };
  }, [canvas]);
  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
      <Button
        onClick={() => {
          const id = canvas.get().activeLayout;
          if (id) void canvas.runLayout(id, { fitCamera: { padding: 60 } });
        }}
      >
        Run the layout
      </Button>
      <Eyebrow>{clicked ? `Clicked: ${clicked}` : 'Click a frame’s header'}</Eyebrow>
    </div>
  );
}

export const GroupFramesStory: Story = {
  name: 'GroupFrames',
  render: function Render() {
    const data = useMemo<GraphData>(
      () =>
        ({
          nodes: lesMiserables.nodes.filter((n) => IDS.has(n.id)),
          edges: lesMiserables.edges.filter((e) => IDS.has(e.source) && IDS.has(e.target)),
        }) as unknown as GraphData,
      [],
    );
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'GroupFrames' }}>
        <Frames />
      </GraphCanvasApp>
    );
  },
};
