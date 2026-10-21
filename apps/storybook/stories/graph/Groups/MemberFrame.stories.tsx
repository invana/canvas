/**
 * **A member frame — a frame round nodes it does not parent.** `group.members`
 * names the nodes; with `autoFit` the frame tracks their bounds. The members
 * keep their own parent (here, none), so the data is untouched.
 *
 * | Do | What happens |
 * |---|---|
 * | drag a member | the frame follows it |
 * | *Run the layout* | the members move; the frame is never placed by the layout — its place is theirs |
 *
 * An annotation's group is drawn this way.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { useGraphCanvas } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Button } from '@invana/ui';

const meta: Meta = { title: 'graph/Groups/MemberFrame' };
export default meta;
type Story = StoryObj;

const MEMBERS = ['Cosette', 'Marius', 'Eponine'];

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

function RunLayout() {
  const canvas = useGraphCanvas();
  return (
    <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
      <Button
        onClick={() => {
          const id = canvas.get().activeLayout;
          if (id) void canvas.runLayout(id, { fitCamera: { padding: 60 } });
        }}
      >
        Run the layout
      </Button>
    </div>
  );
}

export const MemberFrameStory: Story = {
  name: 'MemberFrame',
  render: function Render() {
    const data = useMemo<GraphData>(() => {
      const ids = new Set(['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Eponine', 'Thenardier', 'Gavroche']);
      return {
        nodes: [
          ...lesMiserables.nodes.filter((n) => ids.has(n.id)),
          {
            id: 'frame',
            type: 'frame',
            style: {
              shape: { kind: 'rect', width: 40, height: 40, cornerRadius: 8 },
              bgFill: { kind: 'solid', color: 0x2563eb, alpha: 0.06 },
              bgStrokeColor: 0x2563eb,
              labelText: 'Rue Plumet',
              labelPlacement: 'inside-top-left',
              group: { autoFit: true, padding: 24, headerHeight: 22, members: MEMBERS, showToggle: false }
            }
          }
        ],
        edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
      } as unknown as GraphData;
    }, []);
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'MemberFrame' }}>
        <RunLayout />
      </GraphCanvasApp>
    );
  }
};
