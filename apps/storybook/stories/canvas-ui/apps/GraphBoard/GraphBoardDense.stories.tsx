/**
 * **`<GraphBoard>` on a dense graph** — Flare's imports, ~2,000 relationships.
 * The board's density rules (`EDGE_DENSITY`), shared by the drawing and the
 * footer so they never disagree:
 *
 * | Rule | When | What you see |
 * |---|---|---|
 * | fade | more than 200 relationships | every edge fainter, never below 15 %; hovered and selected ones stay opaque |
 * | thin | 500 or more, zoomed out below 50 % | about 1 in 10 drawn, an even sample; the footer says so; zoom in for all |
 * | label | no `name` · `title` · `label` · `code` · `description` | the readable fallback — type, then id (`readableLabel`) |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { GraphBoard } from '@invana/canvas-ui';
import { flareImports } from './data';

const meta: Meta = { title: 'canvas-ui/apps/GraphBoard/GraphBoardDense' };
export default meta;
type Story = StoryObj;

export const GraphBoardDenseStory: Story = {
  name: 'GraphBoardDense',
  render: function Render() {
    const data = useMemo(flareImports, []);
    return (
      <div className="h-screen">
        <GraphBoard data={data} />
      </div>
    );
  }
};
