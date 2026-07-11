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
import { LayersPanel } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import { Button, type MenuItem } from '@invana/ui';
import { Layers } from 'lucide-react';
import { useState } from 'react';

/**
 * `canvas-ui/views/LayersPanel` — the `@invana/canvas-ui` **LayersPanel** driving
 * a fully-featured `GraphCanvasApp`, surfaced through a right-side **Layers**
 * toggle button (mirroring the settings-browser story).
 *
 * The panel introspects the app's live scene — every registered layer, and the
 * Graph layer's painted nodes/edges grouped by type — as a file-tree. Each layer
 * row has a visibility eye (`layer.setVisible`); right-click any element for
 * Focus · Select · Hide/Show (`store.setNodeHidden` / `setEdgeHidden`, incident
 * edges following via the derived cascade). Click **Layers** in the header to
 * open / close the docked panel; the panel's ✕ closes it too.
 */
const meta: Meta = { title: 'canvas-ui/views/LayersPanel' };
export default meta;
type Story = StoryObj;

// Multi-layout picker for the header toolbar (matches the settings-editors story).
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -200 }, link: { distance: 60 }, animate: false }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

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

/** Right-docked panel — reads the live engine from context. */
function LayersPanelDock({ onClose }: { onClose: () => void }) {
  const canvas = useGraphCanvas();
  return (
    <Panel position="right">
      <div className="h-full w-80 border-l border-border bg-popover">
        <LayersPanel canvas={canvas} onClose={onClose} />
      </div>
    </Panel>
  );
}

export const LayersPanelStory: Story = {
  name: 'LayersPanel',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    const [layersOpen, setLayersOpen] = useState(true);

    // Property-graph dataset → `GraphNode` / `GraphEdge` (label → type). The panel
    // then groups the Graph layer's contents by type (User · N, POSTED · N, …).
    const data = {
      nodes: twitterActivity.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
      edges: twitterActivity.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.label,
      })),
    };

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Click “Layers” (top-right) to toggle the panel')}
          config={{
            layouts: {
              'graph-force': { charge: { strength: -200 }, link: { distance: 60 }, animate: false },
            },
          }}
          header={{
            title: 'Layers Panel',
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

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />

          {/* The star: the canvas-ui LayersPanel, docked right, toggled by the
              header “Layers” button (and its own ✕). */}
          {layersOpen && <LayersPanelDock onClose={() => setLayersOpen(false)} />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
