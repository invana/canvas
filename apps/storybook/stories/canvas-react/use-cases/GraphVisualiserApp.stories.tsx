/**
 * Graph **visualiser, dressed in the app shell** — the read-only explorer ported
 * into `@invana/themes`' `AppLayoutBase`. Instead of floating the controls over
 * the canvas, the chrome lives in the shell's real header / footer bars:
 *
 *   - **Header** — brand (left), the combined canvas toolbar (centre), the
 *     light/dark theme toggle (right).
 *   - **Main** — the `<Canvas>` filling the shell's content area.
 *   - **Footer** — a live status bar (counts / zoom / pan / hover / selection)
 *     plus the shared message line.
 *   - **Right** — a read-only property inspector, opened by clicking a node/edge.
 *
 * The whole shell is the reusable `<StoryGraphApp>` helper
 * (`../_shared`) — this story just feeds it data. See that module for the lifted-
 * context + `CanvasBridge` wiring that lets the header / footer chrome (outside
 * the `<Canvas>` subtree) resolve the live engine.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData, GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

import { StoryGraphApp } from '../_shared';

const meta: Meta = { title: 'canvas-react/usecases/GraphVisualiserApp' };
export default meta;
type Story = StoryObj;

export const GraphVisualiserApp: Story = {
  render: () => {
    type LesMisData = { group: number };
    const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

    // Les Misérables ships no `type` — in a graph DB every node/edge carries a
    // label (its "type"). Stamp graph-DB-style labels so the inspector's Type row
    // has something to show: characters are `Character`, edges `APPEARS_WITH`.
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    return (
      <StoryGraphApp
        data={data}
        title="Graph Visualiser"
        // Drawn labels are the character ids; colour the nodes by les-mis community.
        nodeLabel={(n) => String(n.id)}
        nodeColorLabel={(n) => `community-${groupOf(n)}`}
      />
    );
  },
};
