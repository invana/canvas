/**
 * `<GraphCanvasApp overlay="transparent">` — header and footer **float over a
 * full-bleed canvas** with **no bar background at all**: only the controls
 * themselves paint, so the bars are fully see-through and the graph runs edge to
 * edge behind them. The header (brand · toolbar · theme toggle) pins to the top
 * edge, the footer (status · message) to the bottom.
 *
 * Same slot bags as the docked layout — only `overlay` changes how the bars are
 * positioned + painted. Compare with `OverlayBlur` (glass / backdrop-blur).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  MiniMapLayer,
} from '@invana/canvas-react';

import { Inspector, lesMisData, ThemeToggle } from '../_demo';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/OverlayTransparent' };
export default meta;
type Story = StoryObj;

export const OverlayTransparent: Story = {
  render: () => (
    <GraphCanvasApp
      data={lesMisData()}
      overlay="transparent"
      header={{
        title: 'Overlay · transparent',
        center: <GraphControlsToolbar />,
        right: (ctx) => <ThemeToggle ctx={ctx} />,
      }}
      footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
    >
      <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
      <Inspector />
    </GraphCanvasApp>
  ),
};
