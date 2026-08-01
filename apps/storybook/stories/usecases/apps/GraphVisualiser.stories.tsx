/**
 * Graph **visualiser** — a read-only explorer, composed as an *arrangement* of
 * the package's `<GraphCanvasApp>`. The app ships the batteries bundle (graph ·
 * colour · d3-force · pan/zoom/select/hover) configured entirely through
 * `config`; this story layers the visualiser chrome on top by composition:
 *
 *   - **Header** — brand + a **dataset switcher** (every node-link network in
 *     `@invana/graph-datasets`, each option showing its node / edge counts) +
 *     the full `<GraphControlsToolbar>` (layout · select · style · edit · view ·
 *     grid · history) + the app's light/dark toggle.
 *   - **Main** — the `<Canvas>` with the bundle; each dataset brings its own
 *     `settings.ts` half as `config`, so switching swaps the *look* as well as
 *     the data. Only the label resolver (a function — settings are pure JSON)
 *     and Les Mis's community palette are layered on here.
 *   - **Children** — a minimap and a click-to-open property inspector, dropped in
 *     like any other layer / behaviour.
 *
 * Four datasets ask (in their own settings) for a layout the bundle doesn't
 * ship, under the id `layout` — a hierarchy or a sankey. Those are registered in
 * `onReady` from the same `settings.layouts.layout` params, so the dataset's
 * recommended picture is what you get. Switching remounts the engine via
 * `instanceKey`, so each dataset starts from a clean canvas (no config bleed
 * from the previous one) and `fitOnLoad` re-frames it.
 *
 * Replaces the old `<StoryGraphApp>` preset: the chrome is now explicit, so the
 * same `<GraphCanvasApp>` backs this, a widget, or a quick website demo.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';
import {
  flareAsGraph,
  flareImportsAsGraph,
  flareImportsSettings,
  flareSettings,
  generateLattice,
  generateRandomTree,
  h1b2019AsGraph,
  h1b2019Settings,
  latticeSettings,
  lesMiserables,
  lesMiserablesSettings,
  lifeTreeAsGraph,
  lifeTreeSettings,
  randomTreeSettings,
  twitterActivity,
  twitterActivitySettings,
  ukEnergyFlowAsGraph,
  ukEnergyFlowSettings,
} from '@invana/graph-datasets';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { D3SankeyLayout } from '@invana/graph-layout-d3-sankey';
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
    /**
     * The catalogue — every node-link network the datasets package ships, each
     * paired with the `settings.ts` half authored for it. Materialised **once**
     * (the generators are cheap; H-1B, the big one, is ~35 ms) so the switcher's
     * counts are read off the real graphs and can never drift from the data.
     *
     * `layout` names the layout class this dataset's settings expect under the
     * id `layout`; `null` means it rides the bundle's own `graph-force`.
     * `nodeStyle` is the per-dataset, non-serialisable styling that can't live
     * in a settings JSON.
     */
    const datasets = useMemo(() => {
      // Distinct colour per les-mis community.
      const PALETTE = [
        0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
        0x14b8a6, 0xa3e635,
      ];
      const groupOf = (n: GraphNode): number =>
        (n.data as { group?: number } | undefined)?.group ?? 0;

      const flareImports = flareImportsAsGraph();
      const randomTree = generateRandomTree(120);
      return [
        {
          id: 'les-miserables',
          title: 'Les Misérables',
          // Les Misérables ships no `type` — in a graph DB every node/edge carries
          // a label (its "type"). Stamp graph-DB-style labels so the inspector's
          // Type row has something to show: each node's community `group` becomes
          // its type, so the inspector groups characters by community; edges are
          // `APPEARS_WITH`.
          data: {
            nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
            edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
          } as GraphData,
          settings: lesMiserablesSettings,
          layout: null,
          // The community palette — a resolver, so it can't ride `settings`.
          nodeStyle: { bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]! },
        },
        {
          id: 'twitter',
          title: 'Twitter activity',
          data: twitterActivity as GraphData,
          settings: twitterActivitySettings,
          layout: null,
        },
        {
          id: 'flare',
          title: 'Flare package tree',
          data: flareAsGraph() as GraphData,
          settings: flareSettings,
          layout: 'hierarchy' as const,
        },
        {
          id: 'flare-imports',
          title: 'Flare imports',
          // The only dataset that isn't a plain `{nodes, edges}`: it ships the
          // tree edges and the import edges separately. The import network is
          // what its settings are written for.
          data: { nodes: flareImports.nodes, edges: flareImports.importEdges } as GraphData,
          settings: flareImportsSettings,
          layout: null,
        },
        {
          id: 'h1b-2019',
          title: 'H-1B 2019',
          data: h1b2019AsGraph() as GraphData,
          settings: h1b2019Settings,
          layout: 'hierarchy' as const,
        },
        {
          id: 'life-tree',
          title: 'Tree of life',
          data: lifeTreeAsGraph() as GraphData,
          settings: lifeTreeSettings,
          layout: 'hierarchy' as const,
        },
        {
          id: 'uk-energy-flow',
          title: 'UK energy flow',
          data: ukEnergyFlowAsGraph() as GraphData,
          settings: ukEnergyFlowSettings,
          layout: 'sankey' as const,
        },
        {
          id: 'random-tree',
          title: 'Random tree',
          // The one dataset still in the minimal `{index}` / `{source, target}`
          // shape — mapped onto GraphNode / GraphEdge at the call site, as its
          // module TSDoc asks.
          data: {
            nodes: randomTree.nodes.map((n) => ({ id: String(n.index) })),
            edges: randomTree.edges.map((e, i) => ({
              id: `e${i}`,
              source: String(e.source),
              target: String(e.target),
            })),
          } as GraphData,
          settings: randomTreeSettings,
          layout: null,
        },
        {
          id: 'lattice',
          title: 'Lattice 20×20',
          data: generateLattice(20) as GraphData,
          settings: latticeSettings,
          layout: null,
        },
      ];
    }, []);

    const [datasetId, setDatasetId] = useState(datasets[0]!.id);
    const active = datasets.find((d) => d.id === datasetId) ?? datasets[0]!;

    // Option key → label, with the counts the switcher is asked to surface.
    const datasetOptions = useMemo(
      () =>
        Object.fromEntries(
          datasets.map((d) => [
            d.id,
            `${d.title} · ${d.data.nodes.length.toLocaleString()} nodes · ${d.data.edges.length.toLocaleString()} edges`,
          ]),
        ),
      [datasets],
    );

    // The dataset's own recommended look, plus the two things a settings JSON
    // can't carry: the label resolver and (for Les Mis) the community palette.
    const config = useMemo((): CanvasConfig => {
      const graph = (active.settings.layers?.graph ?? {}) as {
        node?: { style?: Record<string, unknown> };
      };
      return {
        ...active.settings,
        layers: {
          ...active.settings.layers,
          graph: {
            ...graph,
            node: {
              ...graph.node,
              style: {
                ...graph.node?.style,
                labelText: (n: GraphNode) =>
                  String((n.data as { name?: string } | undefined)?.name ?? n.id),
                ...active.nodeStyle,
              },
            },
          },
        },
      };
    }, [active]);

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        // Flare / H-1B / tree-of-life want a hierarchy and UK energy a sankey —
        // layouts the app's bundle doesn't register. Their settings name the id
        // `layout`, so mount that instance here, built from the same params the
        // settings carry (which `config` then re-applies by id).
        const params = active.settings.layouts?.layout ?? {};
        const layout =
          active.layout === 'hierarchy'
            ? new D3HierarchyLayout({
                id: 'layout',
                targetLayerId: 'graph',
                ...params,
              } as ConstructorParameters<typeof D3HierarchyLayout>[0])
            : active.layout === 'sankey'
              ? new D3SankeyLayout({
                  id: 'layout',
                  targetLayerId: 'graph',
                  ...params,
                } as ConstructorParameters<typeof D3SankeyLayout>[0])
              : null;
        if (layout) {
          // A one-shot layout finishes *after* the engine's `fitOnLoad` has run,
          // so frame the result off its own `end` — one frame later, so the
          // positions have flushed to the renderer. (Sankey frames correctly;
          // the d3-hierarchy runs currently don't reach a settled `end`, so the
          // three hierarchy datasets land laid out but unframed — same bug the
          // `graph-layouts/d3-hierarchy/Tree` story shows, where the scene is
          // blank until "Re-fit camera".)
          layout.events.on('end', ({ reason }) => {
            if (reason === 'stopped') return;
            requestAnimationFrame(() => canvas.fitView(80));
          });
          canvas.layouts.add(layout);
        }
        // Seed the footer's <CanvasMessageBar> — idle until `showMessage` is
        // called; persists (no timeout) so the channel is visible in the story.
        canvas.showMessage('Click a node to inspect it');
      },
      [active],
    );

    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it via useTheme() (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={active.data}
          config={config}
          // Each dataset gets a clean engine: its settings apply at init instead
          // of merging over the previous dataset's, and `fitOnLoad` re-frames.
          instanceKey={active.id}
          onReady={onReady}
          header={{
            // The header is just slots — the brand + dataset switcher in `left`,
            // a toolbar in `center`, a theme toggle in `right` (built from the
            // control context the slot render-fn receives).
            left: (
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold whitespace-nowrap">Graph Visualiser</span>
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'select',
                      key: 'dataset',
                      label: 'Dataset',
                      value: active.id,
                      options: datasetOptions,
                      onChange: setDatasetId,
                      tooltip: 'Switch dataset',
                    },
                  ]}
                />
              </div>
            ),
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
