/**
 * `<GraphCanvasApp>` with the **works** — and a showcase that the bundle is just a
 * starting point you extend by composition:
 *
 *   - **Header** — brand · the full `<GraphControlsToolbar>` with a **multi-layout
 *     picker** (force + ELK layered) in the centre · a dev-overlay toggle +
 *     light/dark toggle on the right.
 *   - **Footer** — live status bar + message line.
 *   - **Custom layers** (composed as children) — a minimap and a dev-info overlay
 *     (mounted on demand by the header's dev-overlay toggle).
 *   - **Custom behaviours** — a click-to-inspect that drives the **docked right
 *     section** (via `<ClickViewBehaviour onClick={…}>` → state → `right`, no
 *     floating panel) and label level-of-detail (labels fade when zoomed far).
 *   - **Context menus** — node + background, composed in.
 *   - **Custom settings** — community colours via a `bgFill` resolver on
 *     `config.layers.graph`, looser force in `config.layouts['graph-force']`.
 *
 * Everything past `data` is either `config` (settings) or `children`
 * (extra layers / behaviours / menus) — no bespoke app props.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  ClickViewBehaviour,
  EdgeDetailView,
  NodeDetailView,
  GraphBackgroundContextMenu,
  type GraphBackgroundMenuContext,
  GraphCanvasApp,
  GraphClipboardProvider,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  TextResolutionLODBehaviour,
  type LayoutFactory,
  type ViewContext,
  ThemeToggle,
  useDevTool,
  useMiniMap,
} from '@invana/canvas-react';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import type { MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/FullFeatured' };
export default meta;
type Story = StoryObj;

// Module-scoped so the references stay stable across renders.
const LAYOUTS: Record<string, LayoutFactory> = {
  // `animate: true` — a live, interactive settle so the toolbar's Run button
  // flips to Stop while the simulation runs (click Stop to halt it in place).
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: true }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };
const PALETTE = [0x60a5fa, 0x34d399, 0xf472b6, 0xfbbf24, 0xa78bfa, 0x22d3ee];
const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  // eslint-disable-next-line no-alert
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (_ctx: GraphBackgroundMenuContext): MenuItem[] => [
  // eslint-disable-next-line no-alert
  { id: 'about', label: 'Les Misérables co-appearances', onClick: () => window.alert('Demo graph') },
];

export const FullFeatured: Story = {
  render: () => {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    // The clicked node/edge (or null on a background click) — drives the docked
    // right section below, fed by <ClickViewBehaviour onClick={…}>.
    const [view, setView] = useState<ViewContext | null>(null);
    // Les Misérables ships no `type` — in a graph DB every node/edge carries a
    // label (its "type"). Each node's community `group` becomes its type so the
    // inspector's Type row reflects its real category; edges are `APPEARS_WITH`.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
    // A real consumer mounts the app under its own <ThemeProvider> — the app
    // reads light/dark from it via useTheme() (and throws without one).
    <ThemeProvider>
      <GraphCanvasApp
        data={data}
        // Seed the footer's <CanvasMessageBar> with a line — it's idle (renders
        // nothing) until something calls `canvas.showMessage`. Persists (no
        // timeout) so the message channel is visible in the story.
        onReady={(c) => c?.showMessage('Click a node to inspect it · right-click for actions')}
        config={{
          layouts: {
            'graph-force': {
              charge: { strength: -240 },
              link: { distance: 70 },
              collide: { radius: 18 },
              animate: false,
            },
          },
          // Community colours via a resolver (non-serialisable → still just config);
          // bundle's type-colour behaviour off so the resolver wins.
          behaviours: { color: { enabled: false } },
          layers: {
            graph: {
              node: { style: { bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]! } },
            },
          },
        }}
        header={{
          title: 'Graph Canvas App',
          center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
          right: (ctx) => (
            <>
              {mini.button}
              {dev.button}
              <ThemeToggle ctx={ctx} />
            </>
          ),
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        // The docked right region is **hidden by default** and only mounts once
        // you click a node/edge (see <ClickViewBehaviour onClick> below): omitting
        // the `right` bag hides it and the canvas reclaims the width; a background
        // click clears the selection → `undefined` → the region unmounts again.
        right={
          view
            ? {
                content:
                  view.kind === 'edge' ? <EdgeDetailView ctx={view} /> : <NodeDetailView ctx={view} />,
                // Pin the inspector to exactly 320px: default = min = max, so the
                // panel opens at 320 and the editor absorbs the rest of the width.
                // (react-resizable-panels scales a lone `defaultSize` up to fill the
                // row — pinning all three is the only way to hold an exact width.)
                // It closes via a background click (clears `view` → region unmounts).
                defaultSize: '320px',
                // minSize: '0px',
                maxSize: '320px',
                collapsible: false,
              }
            : undefined
        }
      >
        {/* Extra layers — beyond the bundle. */}
        {mini.layer}
        {dev.layer}

        {/* Extra behaviours — click-to-inspect + label level-of-detail. Instead
            of a floating <Panel>, `onClick` reports the clicked element (or null
            on a background click); the story stashes it in state and renders the
            detail view in the docked `right` region above. */}
        <ClickViewBehaviour id="click-view" targetLayerId="graph" onClick={setView} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

        {/* Right-click menus. */}
        <GraphClipboardProvider layerId="graph">
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphClipboardProvider>
      </GraphCanvasApp>
    </ThemeProvider>
    );
  },
};
