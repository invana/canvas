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
 *   - **Custom behaviours** — a click-to-open property inspector and label
 *     level-of-detail (labels fade out when zoomed far).
 *   - **Context menus** — node + background, composed in.
 *   - **Custom settings** — community colours via a `bgFill` resolver on
 *     `config.layers.graph`, looser force in `config.layouts['graph-force']`.
 *
 * Everything past `data` is either `config` (settings) or `children`
 * (extra layers / behaviours / menus) — no bespoke app props.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  ClickViewBehaviour,
  dockCardClassName,
  ElementDetailViewer,
  GraphBackgroundContextMenu,
  type GraphBackgroundMenuContext,
  GraphCanvasApp,
  GraphClipboardProvider,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  LabelResolutionLODBehaviour,
  type LayoutFactory,
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
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: false }),
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
    return (
    // A real consumer mounts the app under its own <ThemeProvider> — the app
    // reads light/dark from it via useTheme() (and throws without one).
    <ThemeProvider>
      <GraphCanvasApp
        data={lesMiserables}
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
      >
        {/* Extra layers — beyond the bundle. */}
        {mini.layer}
        {dev.layer}

        {/* Extra behaviours — click-to-open inspector + label level-of-detail.
            A full-height right dock; docked layout already bounds the canvas
            between the rails, so no inset is needed. */}
        <ClickViewBehaviour
          id="click-view"
          targetLayerId="graph"
          panel={(ctx) => <ElementDetailViewer ctx={ctx} className={dockCardClassName('right')} />}
        />
        <LabelResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

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
