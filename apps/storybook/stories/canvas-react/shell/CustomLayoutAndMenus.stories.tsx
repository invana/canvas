/**
 * `<StoryGraphApp>` with **customised layout, palette, and a context menu**.
 * Shows `forceOptions` (looser active d3-force), a custom `layouts` /
 * `layoutLabel` picker (force + ELK layered only), a custom `palette` +
 * `nodeColorLabel`, and a `nodeMenu` override that adds an alert action on top of
 * the engine-driven items.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type GraphNodeMenuContext,
  type LayoutFactory,
} from '@invana/canvas-react';
import type { GraphData, GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import type { MenuItem } from '@invana/ui';
import { lesMiserables } from '@invana/graph-datasets';

import { StoryGraphApp, defaultNodeItems } from '../_shared';

const meta: Meta = { title: 'canvas-react/shell/CustomLayoutAndMenus' };
export default meta;
type Story = StoryObj;

// Module-scoped so the references stay stable across renders.
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -300 }, link: { distance: 90 }, animate: false }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force',
  'elk-layered': 'Layered',
};
const COOL_PALETTE = [0x60a5fa, 0x34d399, 0xf472b6, 0xfbbf24, 0xa78bfa, 0x22d3ee] as const;

export const CustomLayoutAndMenus: Story = {
  render: () => {
    type LesMisData = { group: number };
    const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    // Keep the engine-driven items, prepend a custom one.
    const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
      {
        id: 'say-hi',
        label: `Inspect ${ctx.id}`,
        // eslint-disable-next-line no-alert
        onClick: () => window.alert(`Node ${ctx.id}`),
      },
      ...defaultNodeItems(ctx),
    ];

    return (
      <StoryGraphApp
        data={data}
        title="Custom layout & menus"
        // Looser active-layout forces than the shell default.
        forceOptions={{
          charge: { strength: -300 },
          link: { distance: 90 },
          collide: { radius: 22 },
          animate: false,
        }}
        layouts={LAYOUTS}
        layoutLabel={LAYOUT_LABEL}
        palette={COOL_PALETTE}
        nodeColorLabel={(n) => `community-${groupOf(n)}`}
        nodeMenu={nodeMenu}
      />
    );
  },
};
