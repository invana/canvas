import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig, Rect } from '@invana/canvas';
import {
  CanvasMessageBar,
  NodeCentralityBehaviour,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  type LayoutFactory,
  Panel,
  ThemeToggle,
  IconLODBehaviour,
  TextLODBehaviour,
  useDevTool,
  useGraphCanvas,
  useGraphCanvasUpdate,
  useMiniMap,
} from '@invana/canvas-react';
import {
  ContentLODEditor,
  contentLODFormToOptions,
  contentLODOptionsToForm,
  type ContentLODOptions,
  LayersPanelView,
  textLODFields,
} from '@invana/canvas-ui';
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
  Eye,
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
 * The default bundle colours nodes by `type` (one hue per tag). Nodes render at
 * the dataset's **precomputed ForceAtlas2 positions** (no layout runs on load —
 * a synchronous force pass at this scale froze the UI). Two extras
 * layer on top: a **per-tag icon** (Lucide from `lucide-react`, inlined as a
 * `data:` URI on the graph layer template, resolved by `type`) and a
 * **`NodeCentralityBehaviour`** that scales each node by its
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

// On-demand re-layout picker for the header toolbar. Nothing runs on load (the
// graph opens at its precomputed positions); these are opt-in. `applyInitialLayout`
// stays OFF so the initial cartography isn't clobbered.
const LAYOUTS: Record<string, LayoutFactory> = {
  // Force re-layout (~2k nodes / ~5.4k edges). Non-animated → runs to completion
  // synchronously, so it briefly blocks — fine as a deliberate, user-clicked action.
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

// The one config override deep-merged over the bundle defaults: a per-tag `icon`
// on the graph layer's node template, resolved against each stored node by its
// `type`. `CanvasConfig.layers` is an untyped bag, so the resolver rides through
// verbatim — merging with the bundle's shape/label style, its ColorByLabel fill,
// and the NodeCentrality size (four orthogonal channels, none clobbering another).
// Zoom-visibility (hiding labels/icons at overview) is NOT here — it's the
// TextLOD / IconLOD behaviours' job, kept off the render path (see below).
// Module-level so the reference stays stable across re-renders.
const CONFIG: CanvasConfig = {
  // Disable the bundle's auto-run force layout — the nodes ship with precomputed
  // positions, and a synchronous force pass on ~2k nodes blocks the UI on load.
  // `'none'` matches no registered layout, so the engine's layout step no-ops.
  activeLayout: 'none',
  layers: {
    graph: {
      node: {
        style: {
          icon: (node: { type?: string }) =>
            TAG_ICON[(node.type ?? 'unknown') as WdvNodeLabel] ?? TAG_ICON.unknown,
          // The page title lives in `data.name`; wire it to the label text so
          // nodes actually get a label (the bundle only styles labels, it never
          // supplies the text). Hidden below 1.5× by TextLODBehaviour.
          labelText: (node: { data?: { name?: string } }) => node.data?.name ?? '',
        },
      },
    },
  },
};

// Initial zoom bands for the split content-LOD behaviours — the single source
// each behaviour and its editor read, so they start in sync. Text (node labels
// + composite text) hides below 1.5×; icons hide below 1×. Edits in the
// Visibility tab push to each behaviour via setOptions.
// Text hides below 1.5×, BUT the top 3% most-connected pages keep their labels
// at every zoom (relative centrality, so it adapts to any graph). Icons hide
// below 1×.
const TEXT_LOD: ContentLODOptions = { minZoom: 1.5, alwaysShowTop: 0.03 };
const ICON_LOD: ContentLODOptions = { minZoom: 1 };

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
        (<code>NodeCentralityBehaviour</code>, sqrt-scaled) — so hubs read big and typed at a glance.
      </p>
      <p>
Node <strong className="text-foreground">text</strong> (labels + composite text, past 1.5×) and{' '}
        <strong className="text-foreground">icons</strong> (past 1×) stay hidden at the packed
        overview — an unreadable smear at ~2k nodes — and reveal as you zoom in, via the opt-in,
        per-kind <code>TextLODBehaviour</code> / <code>IconLODBehaviour</code> (off the render path;
        toggle only on a zoom threshold crossing) — except the{' '}
        <strong className="text-foreground">top 3% most-connected pages</strong>, whose labels persist
        at every zoom (<code>alwaysShowTop</code>, a relative degree-centrality cut). Keeps pan/zoom
        fast while the hubs stay legible. Tweak each band live in the{' '}
        <strong className="text-foreground">Visibility</strong> tab.
      </p>
    </div>
  );
}

/**
 * Live editors for the split content-LOD behaviours — one `@invana/canvas-ui`
 * `ContentLODEditor` per behaviour (Text · Icon), each wired to its running
 * instance. Editing a band + Apply pushes through
 * `useGraphCanvasUpdate().update({ behaviours: { '<id>': … } })` → that
 * behaviour's `setOptions`, so it re-gates at the new band without a remount.
 * Seeded from {@link TEXT_LOD} / {@link ICON_LOD} so they open in sync.
 */
function VisibilityLODTab() {
  const update = useGraphCanvasUpdate();
  // `CanvasConfig.behaviours` is an untyped bag; the options object rides through
  // verbatim to the target behaviour's `setOptions`.
  const applyTo = (id: string) => (values: ContentLODOptions) =>
    update({ behaviours: { [id]: contentLODFormToOptions(values) as unknown as Record<string, unknown> } });
  return (
    <div className="h-full overflow-y-auto">
      <ContentLODEditor
        title="Text — node labels + composite text"
        fields={textLODFields}
        defaults={contentLODOptionsToForm(TEXT_LOD)}
        onSubmit={applyTo('text-lod')}
      />
      <ContentLODEditor
        title="Icons"
        defaults={contentLODOptionsToForm(ICON_LOD)}
        onSubmit={applyTo('icon-lod')}
      />
    </div>
  );
}

/** Right-docked TabbedPanel — the LayersPanelView is one tab. Closing is owned by
 *  the header “Layers” toggle button (the view itself is chrome-free). */
function LayersPanelDock() {
  const canvas = useGraphCanvas();
  const tabs: TabConfig[] = [
    { value: 'layers', label: 'Layers', icon: Layers, content: <LayersPanelView canvas={canvas} /> },
    { value: 'visibility', label: 'Visibility', icon: Eye, content: <VisibilityLODTab /> },
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
    // hyperlink, with the property-graph → `GraphNode`/`GraphEdge` rename
    // (`label → type`, `properties → data`) plus the dataset's **precomputed
    // ForceAtlas2 positions** (`data.x` / `data.y`) mapped to `position`. Those
    // positions are the whole point of this cartography, and using them means
    // **no layout runs on load** — a synchronous force pass over ~2k nodes /
    // ~5.4k edges is what was freezing the UI (it can't be interrupted). The
    // toolbar can still re-layout on demand. Memoised so panel toggles don't
    // rebuild the graph.
    const data = useMemo(
      () => ({
        nodes: wikipediaDataViz.nodes.map((n) => ({
          id: n.id,
          type: n.label,
          data: n.properties,
          position: { x: n.properties.x, y: n.properties.y },
        })),
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
              // No layout runs (precomputed positions), so nothing auto-frames the
              // camera. Fit once the graph has painted (retry next frame if the
              // bounds aren't ready yet).
              const fit = (): boolean => {
                const layer = c.layers.get('graph') as { getBounds?(): Rect } | undefined;
                const b = layer?.getBounds?.();
                if (b && b.width > 0 && b.height > 0) {
                  c.camera.fitContent(b, 60);
                  return true;
                }
                return false;
              };
              if (!fit()) requestAnimationFrame(() => void fit());
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

          {/* Size every node by its degree (incident-edge count). The dataset is
              a power law (median degree 3, max 73), so `linear` + a wide 6→56
              range keeps the low-degree mass small and lets the hubs genuinely
              dominate (sqrt/log would dampen them into the pack). Writes per-node
              `style.size`, which the renderer, bounds, and force-collide read. */}
          <NodeCentralityBehaviour targetLayerId="graph" direction="both" minSize={6} maxSize={56} scale="linear" />

          {/* Content zoom-LOD — split per kind so text and icons gate
              independently. Both hide the ~2k pieces at the packed overview
              (unreadable there) and reveal past their bands, keeping pan/zoom
              fast. Opt-in, off the render path: they toggle only on a threshold
              crossing. TextLOD covers node labels AND composite internal text. */}
          <TextLODBehaviour
            targetLayerId="graph"
            minZoom={TEXT_LOD.minZoom}
            alwaysShowTop={TEXT_LOD.alwaysShowTop}
          />
          <IconLODBehaviour targetLayerId="graph" minZoom={ICON_LOD.minZoom} />

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
