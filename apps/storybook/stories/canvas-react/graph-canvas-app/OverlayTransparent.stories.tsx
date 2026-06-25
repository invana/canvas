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
  ClickViewBehaviour,
  EdgeDetailView,
  NodeDetailView,
  Panel,
  PanelContent,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ThemeToggle,
  useDevTool,
  useMiniMap,
} from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/OverlayTransparent' };
export default meta;
type Story = StoryObj;

export const OverlayTransparent: Story = {
  render: () => {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    // `margin.y` clears the 25px overlay footer (the minimap is a Pixi layer, so
    // it can't read DOM/CSS — an explicit inset, like the dev overlay's).
    const mini = useMiniMap({
      backgroundLayerId: 'background',
      position: 'bottom-left',
      margin: { x: 12, y: 33 },
    });
    // Les Misérables ships no `type` — in a graph DB every node/edge carries a
    // label (its "type"). Each node's community `group` becomes its type so the
    // inspector's Type row reflects its real category; edges are `APPEARS_WITH`.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({
        ...n,
        type: `Group ${(n.data as { group?: number } | undefined)?.group ?? 0}`,
      })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it via useTheme() (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          // Seed the footer's <CanvasMessageBar> — idle until `showMessage` is
          // called; persists (no timeout) so the channel is visible in the story.
          onReady={(c) => c?.showMessage('Click a node to inspect it')}
          overlay="transparent"
          header={{
            title: 'Overlay · transparent',
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

          {/* Click-to-open read-only inspector — a full-height right-side <Panel>
              (its `style` insets it below the floating 40px header + 25px footer)
              positions a <PanelContent> that owns the surface, header ✕, and body. */}
          <ClickViewBehaviour
            id="click-view"
            targetLayerId="graph"
            panel={(ctx) => (
              <Panel position="right" style={{ top: 40, bottom: 25 }}>
                <PanelContent header={ctx.kind === 'edge' ? 'Edge Detail' : 'Node Detail'} onClose={ctx.close} fill>
                  {ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} /> : <NodeDetailView ctx={ctx} />}
                </PanelContent>
              </Panel>
            )}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
