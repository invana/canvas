/**
 * `<StoryGraphApp>` with `overlay` — the chrome floats **transparently over a
 * full-bleed canvas** instead of sitting in solid in-flow rails. The graph fills
 * the whole viewport; the header toolbar is pinned to the top edge and the footer
 * status / message bars to the bottom edge, both with no background, so the canvas
 * pattern shows through behind them.
 *
 * Because each transparent band is `pointer-events:none` except for its actual
 * controls, you can drag-pan the canvas starting on an *empty* part of the header
 * or footer — the chrome only intercepts clicks on the toolbar buttons and status
 * bars themselves. Flip `overlay` off (the default) to get the in-flow rails of
 * `GraphVisualiserApp`; the same header / footer slots feed both layouts.
 *
 * Contrast with `NoChrome` (chrome stripped entirely) — here the chrome is fully
 * present, just floating rather than docked.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

import { StoryGraphApp } from '../_shared';

const meta: Meta = { title: 'canvas-react/shell/Overlay' };
export default meta;
type Story = StoryObj;

export const Overlay: Story = {
  render: () => {
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return <StoryGraphApp data={data} title="Overlay chrome" overlay />;
  },
};
