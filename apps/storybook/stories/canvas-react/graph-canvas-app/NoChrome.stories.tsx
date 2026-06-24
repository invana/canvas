/**
 * `<GraphCanvasApp>` with **no header or footer** — `showHeader={false}` and no
 * `footer` bag, so neither rail renders. What's left is the full interactive
 * canvas (the bundle: background · graph · colour · force · pan / zoom / drag /
 * hover / select) plus a composed minimap. Omit a region and it's simply gone —
 * no empty rails.
 *
 * The minimal end of the spectrum; contrast with `FullFeatured` (everything on)
 * and `OverlayBlur` / `OverlayTransparent` (full chrome, floating).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { GraphCanvasApp, MiniMapLayer } from '@invana/canvas-react';

import { lesMisData } from '../_demo';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/NoChrome' };
export default meta;
type Story = StoryObj;

export const NoChrome: Story = {
  render: () => (
    <GraphCanvasApp data={lesMisData()} showHeader={false}>
      <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
    </GraphCanvasApp>
  ),
};
