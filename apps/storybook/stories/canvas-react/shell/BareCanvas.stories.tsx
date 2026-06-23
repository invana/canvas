/**
 * `<StoryGraphApp>` stripped to **just the graph** — no header, footer, context
 * menus, inspector, or minimap, and only pan + wheel-zoom behaviours. Shows the
 * subtractive `behaviours` map (each key `false` to omit) and the `show*` chrome
 * toggles, for stories that want a clean canvas with the shell's lifted-context
 * wiring still handled for them.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

import { StoryGraphApp } from '../_shared';

const meta: Meta = { title: 'canvas-react/shell/BareCanvas' };
export default meta;
type Story = StoryObj;

export const BareCanvas: Story = {
  render: () => {
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      <StoryGraphApp
        data={data}
        title="Bare canvas"
        showToolbar={false}
        showFooter={false}
        showContextMenus={false}
        showInspector={false}
        showMiniMap={false}
        // Only camera pan + wheel-zoom; everything else omitted.
        behaviours={{
          pan: true,
          wheel: true,
          dragNode: false,
          pinch: false,
          hover: false,
          clickSelect: false,
          brushSelect: false,
          lassoSelect: false,
          clickView: false,
          labelLod: false,
        }}
      />
    );
  },
};
