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
  ClickViewBehaviour,
  dockCardClassName,
  ElementDetailViewer,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ThemeToggle,
  useDevTool,
  useMiniMap,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/OverlayBlur' };
export default meta;
type Story = StoryObj;

export const OverlayBlur: Story = {
  render: () => {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    // `margin.y` clears the 25px overlay footer (the minimap is a Pixi layer, so
    // it can't read DOM/CSS — an explicit inset, like the dev overlay's).
    const mini = useMiniMap({
      backgroundLayerId: 'background',
      position: 'bottom-left',
      margin: { x: 12, y: 33 },
    });
    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it via useTheme() (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={lesMiserables}
          overlay="blur"
          header={{
            title: 'Overlay · blur',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <>
                {mini.button}
                {dev.button}
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        >
          {mini.layer}
          {dev.layer}

          {/* Click-to-open read-only inspector — a full-height right dock, inset
              below the 40px header + 25px footer via explicit `top` / `bottom`. */}
          <ClickViewBehaviour
            id="click-view"
            targetLayerId="graph"
            panel={(ctx) => (
              <ElementDetailViewer
                ctx={ctx}
                className={dockCardClassName('right')}
                style={{ top: 40, bottom: 25 }}
              />
            )}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
