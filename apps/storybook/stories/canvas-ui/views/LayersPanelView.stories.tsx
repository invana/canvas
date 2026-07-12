import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
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
import type { GraphLayer } from '@invana/graph';
import { twitterActivity } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import { Button, TabbedPanel, type MenuItem, type TabConfig } from '@invana/ui';
import { Info, Layers } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/**
 * `canvas-ui/views/LayersPanelView` — the `@invana/canvas-ui` **LayersPanelView** driving
 * a fully-featured `GraphCanvasApp`, surfaced through a right-side **Layers**
 * toggle button (mirroring the settings-browser story).
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

// Multi-layout picker for the header toolbar. First entry is the toolbar's
// initial layout (applied on mount via `applyInitialLayout`).
const LAYOUTS: Record<string, LayoutFactory> = {
  // ELK compound: nests `parentId` groups so members are packed INSIDE their
  // container box — the group renders as one crisp contained cluster.
  'elk-groups': () => new ElkLayout({ algorithm: 'layered', direction: 'DOWN', includeGroups: true }),
  // d3-force with a cluster force — keeps group members together (approximate).
  'd3-force': () =>
    new D3ForceLayout({
      charge: { strength: -200 },
      link: { distance: 60 },
      cluster: { strength: 0.9 },
      animate: false,
    }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'elk-groups': 'Groups (ELK)',
  'd3-force': 'Force',
  'elk-layered': 'Layered',
};

// Active-toggle treatment for header buttons (per canvas-react's ACTIVE_CLASS
// convention — a subtle primary tint + ring over a ghost Button).
const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Twitter activity graph', onClick: () => window.alert('Demo graph') },
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

/**
 * While a group container is hovered, lift its member nodes above the group's
 * (opaque, hover-raised) frame so they stay visible — the bundle's hover
 * behaviour raises the *hovered* node (the group), but its members aren't in the
 * hovered set (no edges), so without this they'd be occluded. Restores on
 * hover-out. Renders nothing.
 */
function GroupHoverRaise({ groupIds }: { groupIds: readonly string[] }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>('graph');
    const renderer = layer?.getRenderer();
    const store = layer?.store;
    if (!layer || !renderer || !store) return;
    const groups = new Set(groupIds);
    // The bundle's hover behaviour uses the `highlighted` state; catch it flip on
    // a group and raise/reset its descendants' z-order (well above any tier).
    return store.events.on('node:state', ({ nodeId, name, on }) => {
      if (name !== 'highlighted' || !groups.has(nodeId)) return;
      for (const descId of store.descendantsOf(nodeId)) {
        renderer.raiseShape(descId, on ? 1000 : 0);
      }
    });
  }, [canvas, groupIds]);
  return null;
}

const GROUP_IDS = ['grp-users', 'grp-tags'] as const;

export const LayersPanelStory: Story = {
  name: 'LayersPanelView',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    const [layersOpen, setLayersOpen] = useState(true);

    // Property-graph dataset → `GraphNode` / `GraphEdge` (label → type). Memoised
    // so re-renders (e.g. toggling the panel) don't rebuild it and re-trigger the
    // active layout. The panel groups the Graph layer's contents by type.
    const data = useMemo(() => {
      const baseNodes = twitterActivity.nodes.map((n) => ({
        id: n.id,
        type: n.label,
        data: n.properties,
      }));
      // Add two container groups (`style.group`) and re-parent a handful of nodes
      // into each, so the panel shows a **Groups** section alongside Nodes / Edges.
      const userIds = new Set(baseNodes.filter((n) => n.type === 'User').slice(0, 5).map((n) => n.id));
      const tagIds = new Set(baseNodes.filter((n) => n.type === 'Hashtag').slice(0, 5).map((n) => n.id));
      const groupStyle = (fill: number) => ({
        shape: { kind: 'circle' as const, radius: 40 },
        bgFill: fill,
        bgAlpha: 0.85,
        bgStrokeColor: 0x6b7fff,
        bgStrokeWidth: 1.5,
        group: { autoFit: true, padding: 24, behindChildren: true },
      });
      return {
        nodes: [
          { id: 'grp-users', type: 'group', data: { label: 'Active users' }, style: groupStyle(0xdbe4ff) },
          { id: 'grp-tags', type: 'group', data: { label: 'Trending tags' }, style: groupStyle(0xffe4e6) },
          ...baseNodes.map((n) =>
            userIds.has(n.id)
              ? { ...n, parentId: 'grp-users' }
              : tagIds.has(n.id)
                ? { ...n, parentId: 'grp-tags' }
                : n,
          ),
        ],
        edges: twitterActivity.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.label,
        })),
      };
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) =>
            c?.showMessage('Groups are laid out as contained clusters (ELK compound) · switch layout in the toolbar')
          }
          header={{
            title: 'Layers Panel',
            // `applyInitialLayout` runs the first layout (ELK compound) on mount,
            // so groups render contained without touching the toolbar.
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} applyInitialLayout />,
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

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />

          {/* Keep group members visible above the frame while a group is hovered. */}
          <GroupHoverRaise groupIds={GROUP_IDS} />

          {/* The star: the canvas-ui LayersPanelView, docked right, toggled by the
              header “Layers” button. */}
          {layersOpen && <LayersPanelDock />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
