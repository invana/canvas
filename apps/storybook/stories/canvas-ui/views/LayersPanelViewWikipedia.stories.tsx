import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig } from '@invana/canvas';
import {
  CanvasMessageBar,
  DegreeSizeBehaviour,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  type LayoutFactory,
  Panel,
  ThemeToggle,
  useDevTool,
  useGraphCanvas,
  useMiniMap,
} from '@invana/canvas-react';
import { LayersPanelView } from '@invana/canvas-ui';
import type { NodeIcon } from '@invana/graph';
import { wikipediaDataViz, type WdvNodeLabel } from '@invana/graph-datasets/wikipedia-dataviz';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { ThemeProvider } from '@invana/themes';
import { Button, TabbedPanel, type MenuItem, type TabConfig } from '@invana/ui';
import {
  BarChart3,
  Building2,
  Cpu,
  File,
  GraduationCap,
  Info,
  Landmark,
  Layers,
  Lightbulb,
  List,
  type LucideIcon,
  Sigma,
  User,
  Wrench,
} from 'lucide-react';
import { createElement, useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * `canvas-ui/views/LayersPanelView` — the `@invana/canvas-ui` **LayersPanelView**
 * driving a fully-featured `GraphCanvasApp`, surfaced through a right-side
 * **Layers** toggle button (the same shell as the Game of Thrones story, on a
 * different dataset).
 *
 * Driven by the **entire sigma.js "cartography of Wikipedia pages around data
 * visualization"** dataset (`@invana/graph-datasets/wikipedia-dataviz`) loaded
 * 1:1 — ~2k pages across eleven `tag` types (`unknown`, `Field`, `Concept`,
 * `Method`, `Chart type`, `Technology`, `Tool`, `Person`, `List`,
 * `Organization`, `Company`) wired by ~5.4k directed `links_to` hyperlinks. No
 * synthetic grouping; the panel browses the graph by its real node/edge types.
 * The default bundle colours nodes by `type` (one hue per tag) and lays them out
 * with a one-shot d3-force pass that fits to content on completion. Two extras
 * layer on top: a **per-tag icon** (Lucide from `lucide-react`, inlined as a
 * `data:` URI on the graph layer template, resolved by `type`) and a
 * **`DegreeSizeBehaviour`** that scales each node by its
 * connection count — so tag reads three ways at once (colour · icon · degree).
 *
 * The view is one tab of a right-docked `<TabbedPanel>` (Layers · About). It
 * introspects the app's live scene — every registered layer, and the Graph
 * layer's painted nodes/edges grouped by type — as a file-tree. Each layer row
 * has a visibility eye (`layer.setVisible`); right-click any element for
 * Focus · Select · Hide/Show (`store.setNodeHidden` / `setEdgeHidden`, incident
 * edges following via the derived cascade). Click **Layers** in the header to
 * open / close the docked tabbed panel.
 */
const meta: Meta = { title: 'canvas-ui/views/LayersPanelView' };
export default meta;
type Story = StoryObj;

// Multi-layout picker for the header toolbar. d3-force is first — matching the
// bundle's own active layout, which runs on mount and frames the graph — so the
// picker's initial selection reflects what's actually on screen. Grid / circular
// are instant O(n) re-layouts. `applyInitialLayout` is intentionally OFF: the
// bundle's active force layout already does the initial placement + fit; a second
// initial layout here would fight it.
const LAYOUTS: Record<string, LayoutFactory> = {
  // Force is comfortable at this scale (~2k nodes / ~5.4k edges). Non-animated:
  // runs the simulation to completion off-frame, then snaps to final positions.
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -160 }, link: { distance: 56 }, animate: false }),
  grid: () => new GeometricLayout({ mode: 'grid', columnGap: 70, rowGap: 70 }),
  circular: () => new GeometricLayout({ mode: 'circular' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force',
  grid: 'Grid',
  circular: 'Circular',
};

// Active-toggle treatment for header buttons (per canvas-react's ACTIVE_CLASS
// convention — a subtle primary tint + ring over a ghost Button).
const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

// One real SVG icon per tag kind, straight from the `lucide-react` package (no
// remote CDN) — the node-icon channel. Each icon component is serialised once to
// inline SVG markup and handed to `svg-url` as a local `data:` URI; the engine
// loads it with no network, flattens it to a path, tints it white so it reads on
// the colour-by-tag fill, and sizes it relative to the node via `sizeRatio` (so
// it grows with the degree-based size). Vector icons, not glyphs.
const iconDataUri = (Icon: LucideIcon): string =>
  `data:image/svg+xml,${encodeURIComponent(renderToStaticMarkup(createElement(Icon)))}`;

const tagIcon = (Icon: LucideIcon): NodeIcon => ({
  kind: 'svg-url',
  url: iconDataUri(Icon),
  color: 0xffffff,
  strokeWidth: 2,
  sizeRatio: 0.55,
});

const TAG_ICON: Record<WdvNodeLabel, NodeIcon> = {
  Tool: tagIcon(Wrench),
  Person: tagIcon(User),
  Field: tagIcon(GraduationCap),
  'Chart type': tagIcon(BarChart3),
  Concept: tagIcon(Lightbulb),
  Method: tagIcon(Sigma),
  Technology: tagIcon(Cpu),
  Company: tagIcon(Building2),
  Organization: tagIcon(Landmark),
  List: tagIcon(List),
  unknown: tagIcon(File),
};

// Config overrides deep-merged over the bundle defaults:
//   - `icon` — a per-tag icon on the graph layer's node template, resolved
//     against each stored node by its `type`. `CanvasConfig.layers` is an
//     untyped bag, so the resolver rides through verbatim — merging with the
//     bundle's shape/label style, its ColorByLabel fill, and the DegreeSize
//     size (four orthogonal channels, none clobbering another).
//   - `labelMinZoom` — hide the ~2k node labels until the camera zooms past 1.5×.
//     The renderer enforces this per label with no LOD behaviour, so at the
//     packed overview zoom (where labels are an unreadable smear anyway) zero
//     `Text` objects render — pixi's priciest primitive — keeping pan/zoom fast;
//     labels fade in only once you zoom in to inspect individual pages.
// Module-level so the reference stays stable across re-renders.
const CONFIG: CanvasConfig = {
  layers: {
    graph: {
      node: {
        style: {
          icon: (node: { type?: string }) =>
            TAG_ICON[(node.type ?? 'unknown') as WdvNodeLabel] ?? TAG_ICON.unknown,
          labelMinZoom: 1.5,
        },
      },
    },
  },
};

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Page ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  {
    id: 'about',
    label: 'Wikipedia data-viz cartography — full graph',
    onClick: () =>
      window.alert(
        `Entire sigma.js data-viz dataset: ${wikipediaDataViz.meta.nodeCount} nodes / ${wikipediaDataViz.meta.edgeCount} edges`,
      ),
  },
];

/** Header toggle — opens / closes the docked layers panel. */
function LayersToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      title="Layers"
      aria-label="Toggle layers panel"
      className={`h-8 w-8 p-0 ${open ? ACTIVE_CLASS : ''}`}
    >
      <Layers className="h-4 w-4" />
    </Button>
  );
}

/** A second tab so the dock reads as a real tabbed inspector. */
function AboutTab() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3 text-sm text-muted-foreground">
      <p>
        The <strong className="text-foreground">Layers</strong> tab hosts the{' '}
        <code>@invana/canvas-ui</code> <strong className="text-foreground">LayersPanelView</strong>{' '}
        — a live browser of the canvas layers and the graph&apos;s nodes/edges grouped by type.
      </p>
      <p>Toggle a layer eye to hide/show a whole layer; right-click any element for Focus · Select · Hide/Show.</p>
      <p>
        Loaded here: the{' '}
        <strong className="text-foreground">entire Wikipedia data-visualization cartography</strong>{' '}
        (the flagship sigma.js demo) — {wikipediaDataViz.meta.nodeCount.toLocaleString()} pages /{' '}
        {wikipediaDataViz.meta.edgeCount.toLocaleString()} hyperlinks across eleven tag types and{' '}
        {wikipediaDataViz.meta.clusters.length} community-detected topic clusters. Each page also
        carries its ForceAtlas2 position and a PageRank-like score in <code>data</code>.
      </p>
      <p>
        Each of the eleven tag types reads three ways at once:{' '}
        <strong className="text-foreground">colour</strong> (bundle{' '}
        <code>ColorByLabelBehaviour</code>), an <strong className="text-foreground">icon</strong>{' '}
        (Lucide, from <code>lucide-react</code>), and <strong className="text-foreground">size by degree</strong>{' '}
        (<code>DegreeSizeBehaviour</code>, sqrt-scaled) — so hubs read big and typed at a glance.
      </p>
      <p>
        Node <strong className="text-foreground">labels</strong> stay hidden at the packed overview
        (an unreadable smear at ~2k nodes) and fade in past 1.5× zoom
        (<code>labelMinZoom</code>) — keeping pan/zoom fast until you zoom in to read individual pages.
      </p>
    </div>
  );
}

/** Right-docked TabbedPanel — the LayersPanelView is one tab. Closing is owned by
 *  the header “Layers” toggle button (the view itself is chrome-free). */
function LayersPanelDock() {
  const canvas = useGraphCanvas();
  const tabs: TabConfig[] = [
    { value: 'layers', label: 'Layers', icon: Layers, content: <LayersPanelView canvas={canvas} /> },
    { value: 'about', label: 'About', icon: Info, content: <AboutTab /> },
  ];
  return (
    <Panel position="right">
      <div className="h-full w-80 border-l border-border bg-popover">
        <TabbedPanel
          tabs={tabs}
          defaultTab="layers"
          className="flex h-full flex-col overflow-hidden"
          bodyClassName="min-h-0 flex-1 overflow-hidden"
        />
      </div>
    </Panel>
  );
}

export const WikipediaDataViz: Story = {
  name: 'Wikipedia Data-Viz',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    const [layersOpen, setLayersOpen] = useState(true);

    // The ENTIRE Wikipedia data-viz graph, loaded 1:1 — every page and every
    // hyperlink, with only the property-graph → `GraphNode`/`GraphEdge` rename
    // (`label → type`, `properties → data`). No filtering, no thresholds, no
    // synthetic groups. The panel browses it by its real node/edge types; the
    // bundle's ColorByLabelBehaviour tints each of the eleven tag types. Memoised
    // so re-renders (e.g. toggling the panel) don't rebuild the ~2k nodes /
    // ~5.4k edges and re-trigger the active layout.
    const data = useMemo(
      () => ({
        nodes: wikipediaDataViz.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
        edges: wikipediaDataViz.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.label,
        })),
      }),
      [],
    );

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={CONFIG}
          onReady={(c) => {
            if (c) {
              c.showMessage(
                `Loaded the full Wikipedia data-viz cartography — ${wikipediaDataViz.meta.nodeCount} nodes / ${wikipediaDataViz.meta.edgeCount} edges (sigma.js demo)`,
              );
            }
          }}
          header={{
            title: 'Wikipedia data-viz · Full graph',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                <LayersToggleButton open={layersOpen} onToggle={() => setLayersOpen((o) => !o)} />
                {mini.button}
                {dev.button}
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        >
          {/* Extra layers — minimap + on-demand dev overlay. */}
          {mini.layer}
          {dev.layer}

          {/* Size every node by its degree (incident-edge count). sqrt curve
              dampens the hub long-tail; writes per-node `style.size`, which the
              renderer, bounds, and force-collide all read. */}
          <DegreeSizeBehaviour targetLayerId="graph" direction="both" minSize={10} maxSize={42} scale="sqrt" />

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />

          {/* The star: the canvas-ui LayersPanelView, docked right, toggled by the
              header “Layers” button. */}
          {layersOpen && <LayersPanelDock />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
