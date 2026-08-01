/**
 * Graph **visualiser** — a read-only explorer, composed as an *arrangement* of
 * the package's `<GraphCanvasApp>`. The app ships the batteries bundle (graph ·
 * colour · d3-force · pan/zoom/select/hover) configured entirely through
 * `config`; this story layers the visualiser chrome on top by composition:
 *
 *   - **Header** — brand + the full `<GraphControlsToolbar>` (layout · select ·
 *     style · edit · view · grid · history) + the app's light/dark toggle.
 *   - **Main** — the `<Canvas>` with the bundle; node labels + community colours
 *     ride `main.graphLayer` (non-serialisable resolvers — they can't be `config`).
 *   - **Children** — a minimap and a click-to-open property inspector, dropped in
 *     like any other layer / behaviour.
 *
 * Replaces the old `<StoryGraphApp>` preset: the chrome is now explicit, so the
 * same `<GraphCanvasApp>` backs this, a widget, or a quick website demo.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphData, GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ClickViewBehaviour, MiniMapLayer, type ViewContext } from '@invana/canvas-react';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, EdgeDetailView, NodeDetailView, Panel, PanelContent, ToolbarItems } from '@invana/canvas-ui';
import { Moon, Sun } from 'lucide-react';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'usecases/apps/GraphVisualiser' };
export default meta;
type Story = StoryObj;

export const GraphVisualiserStory: Story = {
  name: 'GraphVisualiser',
  render: () => {
    // Distinct colour per les-mis community.
    const PALETTE = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
      0x14b8a6, 0xa3e635,
    ];
    const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

    // Les Misérables ships no `type` — in a graph DB every node/edge carries a
    // label (its "type"). Stamp graph-DB-style labels so the inspector's Type row
    // has something to show: each node's community `group` becomes its type, so
    // the inspector groups characters by community; edges are `APPEARS_WITH`.
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
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
          header={{
            title: 'Graph Visualiser',
            // The header is just slots — a toolbar in `center`, a theme toggle in
            // `right` (built from the control context the slot render-fn receives).
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          // All graph settings ride `config` — including the (non-serialisable)
          // label + community-colour resolvers on `config.layers.graph`. The
          // bundle's type-based colour behaviour is turned off so `bgFill` wins.
          config={{
            behaviours: { color: { enabled: false } },
            layers: {
              graph: {
                node: {
                  style: {
                    labelText: (n: GraphNode) => String(n.id),
                    bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]!,
                  },
                },
              },
            },
          }}
          // Footer is just slots too — status bar on the left, message line on the right.
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        >
          <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
          <ClickViewBehaviour
            id="click-view"
            targetLayerId="graph"
            panel={(ctx: ViewContext) => (
              <Panel position="right">
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
