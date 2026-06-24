/**
 * `<GraphCanvasApp overlay="blur">` — header and footer **float over a full-bleed
 * canvas** as **glass bars**: translucent with a backdrop blur, no border, so the
 * graph shows through behind them while the controls stay legible. The header
 * (brand · toolbar · theme toggle) pins to the top edge, the footer (status ·
 * message) to the bottom.
 *
 * Same slot bags as the docked layout — only `overlay` changes how the bars are
 * positioned + painted. Compare with `OverlayTransparent` (fully see-through).
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

const meta: Meta = { title: 'canvas-react/graph-canvas-app/OverlayBlur' };
export default meta;
type Story = StoryObj;

export const OverlayBlur: Story = {
  render: () => (
    <GraphCanvasApp
      data={lesMisData()}
      overlay="blur"
      header={{
        title: 'Overlay · blur',
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
