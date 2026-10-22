/**
 * **`<LayeredDagBoard>` with connect — drawing an edge creates a dependency.**
 * The switch top-left arms a drag from one task onto another; the board never
 * draws the edge, it hands both ends to `onConnect` and the host's data adds it.
 *
 * | Drag | Host answers | Board shows |
 * |---|---|---|
 * | a task onto one that does not wait on it | `null` — accepted | the new edge, laid out again |
 * | a task onto one it already waits on | a refusal (it would make a loop) | the refusal in the legend strip |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { LayeredDagBoard } from '@invana/canvas-ui';
import type { GraphData, GraphEdge } from '@invana/graph';
import { PLAN_LEGEND, projectPlan } from './data';

const meta: Meta = { title: 'canvas-ui/apps/LayeredDagBoard/LayeredDagBoardConnect' };
export default meta;
type Story = StoryObj;

/** True when `from` can already reach `to` along the edges. */
function reaches(edges: readonly GraphEdge[], from: string, to: string): boolean {
  const seen = new Set<string>();
  const walk = (id: string): boolean => {
    if (id === to) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return edges.some((e) => e.source === id && walk(e.target));
  };
  return walk(from);
}

export const LayeredDagBoardConnectStory: Story = {
  name: 'LayeredDagBoardConnect',
  render: function Render() {
    const initial = useMemo(projectPlan, []);
    const [data, setData] = useState<GraphData>(initial);
    return (
      <div className="h-screen">
        <LayeredDagBoard
          data={data}
          chrome="panel"
          legend={PLAN_LEGEND}
          connect={{
            label: 'Connect — drag a task onto the one that waits for it',
            hint: 'Connect: drag a task onto the one that waits for it.',
            onConnect: (source, target) => {
              if (source === target || reaches(data.edges, target, source)) return `${target} already comes before ${source} — that would make a loop.`;
              setData((d) => ({
                ...d,
                edges: [...d.edges, { id: `${source}->${target}`, type: 'order', source, target, data: {} } as GraphEdge],
              }));
              return null;
            },
          }}
        />
      </div>
    );
  },
};
