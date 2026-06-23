/**
 * `<StoryGraphApp>` focused on **selection + inspection**, with a pared-down
 * toolbar. Demonstrates per-behaviour overrides (`clickSelect: { multiple:false }`
 * for single-select) alongside `toolbarSections` to show only the view + grid
 * groups — the rest of the shell (footer stats/message, context menus, the
 * click-to-view inspector) stays on.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

import { StoryGraphApp } from '../_shared';

const meta: Meta = { title: 'canvas-react/shell/SelectOnly' };
export default meta;
type Story = StoryObj;

export const SelectOnly: Story = {
  render: () => {
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      <StoryGraphApp
        data={data}
        title="Select & inspect"
        // Single-select; no drag-select modes or node dragging.
        behaviours={{
          clickSelect: { multiple: false },
          brushSelect: false,
          lassoSelect: false,
          dragNode: false,
        }}
        // Toolbar trimmed to just the view controls + grid toggle.
        toolbarSections={{
          history: false,
          layout: false,
          selectMode: false,
          style: false,
          edit: false,
          backend: false,
        }}
      />
    );
  },
};
