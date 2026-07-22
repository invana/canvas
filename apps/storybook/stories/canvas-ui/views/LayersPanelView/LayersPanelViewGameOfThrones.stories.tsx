import type { Meta, StoryObj } from '@storybook/react-vite';
import { EdgeLODBehaviour, GraphCanvasContext, type LayoutFactory } from '@invana/canvas-react';
import { CanvasMessageBar, GraphBackgroundContextMenu, GraphCanvasApp, GraphControlsToolbar, GraphNodeContextMenu, type GraphNodeMenuContext, GraphStatusBar, ThemeToggle, useDevTool, useMiniMap } from '@invana/canvas-ui';
import { wireTelemetry } from '@invana/canvas-store';
import { LayersPanelView } from '@invana/canvas-ui';
import { otelTelemetry } from '@invana/canvas-telemetry-otel';
import { gameOfThrones } from '@invana/graph-datasets/game-of-thrones';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { GeometricLayout } from '@invana/graph-layout-geometric';
import { ThemeProvider } from '@invana/themes';
import { Button, TabbedPanel, type MenuItem, type TabConfig } from '@invana/ui';
import { Info, Layers } from 'lucide-react';
import { useContext, useMemo, useRef, useState } from 'react';

/**
 * `canvas-ui/views/LayersPanelView` — the `@invana/canvas-ui` **LayersPanelView** driving
 * a fully-featured `GraphCanvasApp`, surfaced through a right-side **Layers**
 * toggle button (mirroring the settings-browser story).
 *
 * Driven by the **entire Game of Thrones** dataset
 * (`@invana/graph-datasets/game-of-thrones`) loaded 1:1 — ~5k vertices across
 * seven types (character, scene, episode, season, location, subLocation, house)
 * and ~29k edges across six relations (member_of, part_of, located_at, within,
 * appears_in, co_appears_with). No synthetic grouping; the panel browses the
 * graph by its real node/edge types. Starts on a grid layout (the only one that
 * scales instantly to this size).
 *
 * The view is one tab of a right-docked `<TabbedPanel>` (Layers · About). It
 * introspects the app's live scene — every registered layer, and the Graph
 * layer's painted nodes/edges grouped by type — as a file-tree. Each layer row
 * has a visibility eye (`layer.setVisible`); right-click any element for
 * Focus · Select · Hide/Show (`store.setNodeHidden` / `setEdgeHidden`, incident
 * edges following via the derived cascade). Click **Layers** in the header to
 * open / close the docked tabbed panel.
 */
const meta: Meta = { title: 'canvas-ui/views/LayersPanelView/Game of Thrones' };
export default meta;
type Story = StoryObj;

// Multi-layout picker for the header toolbar. First entry is the toolbar's
// initial layout (applied on mount via `applyInitialLayout`).
const LAYOUTS: Record<string, LayoutFactory> = {
  // Grid is O(n) and instant — the safe default for the full ~5k-node /
  // ~29k-edge graph (ELK would hang, force is heavy). First entry, so
  // `applyInitialLayout` runs it on mount.
  grid: () => new GeometricLayout({ mode: 'grid', columnGap: 70, rowGap: 70 }),
  circular: () => new GeometricLayout({ mode: 'circular' }),
  // Force is available but heavy on a graph this dense. Non-animated: runs the
  // simulation to completion off-frame, then snaps to the final positions.
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -60 }, link: { distance: 30 }, animate: false }),
};
const LAYOUT_LABEL: Record<string, string> = {
  grid: 'Grid',
  circular: 'Circular',
  'd3-force': 'Force',
};

// Active-toggle treatment for header buttons (per canvas-react's ACTIVE_CLASS
// convention — a subtle primary tint + ring over a ghost Button).
const ACTIVE_CLASS = 'bg-primary/15 text-primary ring-1 ring-primary/25';

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  {
    id: 'about',
    label: 'Game of Thrones — full graph',
    onClick: () =>
      window.alert(
        `Entire GoT dataset: ${gameOfThrones.meta.nodeCount} nodes / ${gameOfThrones.meta.edgeCount} edges`,
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
        Loaded here: the <strong className="text-foreground">entire Game of Thrones graph</strong> —{' '}
        {gameOfThrones.meta.nodeCount.toLocaleString()} nodes / {gameOfThrones.meta.edgeCount.toLocaleString()} edges
        across seven node types and six relations.
      </p>
    </div>
  );
}

/**
 * The docked right-region body — a TabbedPanel whose Layers tab hosts the
 * `LayersPanelView`. Closing is owned by the header “Layers” toggle (the view
 * itself is chrome-free). It renders inside `GraphCanvasApp`'s resizable `right`
 * section (a **sibling** of `<Canvas>`, under the lifted context), so it guards
 * for the canvas being `null` before the engine is ready (`useGraphCanvas()`
 * throws on null — read the context directly). The section is the resizable
 * container; the panel just fills it.
 */
function LayersPanelDock() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  const tabs: TabConfig[] = [
    { value: 'layers', label: 'Layers', icon: Layers, content: <LayersPanelView canvas={canvas} /> },
    { value: 'about', label: 'About', icon: Info, content: <AboutTab /> },
  ];
  return (
    <TabbedPanel
      tabs={tabs}
      defaultTab="layers"
      className="flex h-full flex-col overflow-hidden bg-card"
      bodyClassName="min-h-0 flex-1 overflow-hidden"
    />
  );
}

export const LayersPanelStory: Story = {
  name: 'Game of Thrones',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    const [layersOpen, setLayersOpen] = useState(true);

    // OpenTelemetry for this canvas — traces + metrics (FPS) + logging to the
    // OTLP collector (→ HyperDX) under service `invana-canvas`. `otelTelemetry`
    // (from `@invana/canvas-telemetry-otel`) builds the exporter-backed
    // `CanvasTelemetryConfig`; `wireTelemetry` attaches every enabled stream to
    // the live canvas in `onReady`. This is exactly how any app enables it —
    // `new Canvas({ telemetry: otelTelemetry({...}) })` — shown wired at the
    // story level. Built once per mount; disposed when the canvas tears down.
    const telemetry = useMemo(
      () =>
        otelTelemetry({
          serviceName: 'invana-canvas',
          traces: true,
          metrics: true,
          logging: 'info',
        }),
      [],
    );
    const disposeTelemetry = useRef<(() => void) | null>(null);

    // The ENTIRE Game of Thrones graph, loaded 1:1 — every vertex and every
    // edge, with only the property-graph → `GraphNode`/`GraphEdge` rename
    // (`label → type`, `properties → data`). No filtering, no thresholds, no
    // synthetic groups. The panel browses it by its real node/edge types.
    // Memoised so re-renders (e.g. toggling the panel) don't rebuild the ~5k
    // nodes / ~29k edges and re-trigger the active layout.
    const data = useMemo(
      () => ({
        nodes: gameOfThrones.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
        edges: gameOfThrones.edges.map((e) => ({
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
          onReady={(c) => {
            if (c) {
              // Attach telemetry to the live engine's store + bus. Zoom / drag /
              // hover now stream FPS metrics + per-gesture spans to HyperDX.
              disposeTelemetry.current = wireTelemetry(
                { view: c.store.view, events: c.events },
                telemetry,
              );
              c.showMessage(
                `Loaded the full Game of Thrones graph — ${gameOfThrones.meta.nodeCount} nodes / ${gameOfThrones.meta.edgeCount} edges · telemetry → HyperDX (service invana-canvas)`,
              );
            } else {
              // Canvas torn down — detach the telemetry subscriptions.
              disposeTelemetry.current?.();
              disposeTelemetry.current = null;
            }
          }}
          header={{
            title: 'Game of Thrones · Full graph',
            // `applyInitialLayout` runs the first layout (grid) on mount — the
            // only one that places ~5k nodes instantly.
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
          // The star: the canvas-ui LayersPanelView, docked into the app's
          // resizable `right` region (no floating Panel), toggled by the header
          // “Layers” button — omit the bag to hide it and reclaim the width.
          right={
            layersOpen
              ? { content: <LayersPanelDock />, defaultSize: '320px', maxSize: '460px', collapsible: true }
              : undefined
          }
        >
          {/* Extra layers — minimap + on-demand dev overlay. */}
          {mini.layer}
          {dev.layer}

          {/* Zoomed-out perf lever: below 0.5x zoom the ~29k edges merge into a
              sub-pixel blob yet the renderer still draws every one (viewport
              culling can't help — everything is on screen). EdgeLODBehaviour
              thins them to the top 10% by degree below the threshold and
              restores them all above it, so the fit-the-whole-graph view costs a
              fraction to draw while the zoomed-in view is untouched. */}
          <EdgeLODBehaviour minZoom={0.5} keepFraction={0.1} keepBy="degree" />

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
