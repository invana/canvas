/**
 * `<GraphCanvasApp>` with the **works** — and a showcase that the bundle is just a
 * starting point you extend by composition:
 *
 *   - **Header** — brand · the full `<GraphControlsToolbar>` with a **multi-layout
 *     picker** (force + ELK layered) · light/dark toggle.
 *   - **Footer** — live status bar + message line.
 *   - **Custom layers** (composed as children) — a minimap and a dev-info overlay.
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
  DevInfoLayer,
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
  MiniMapLayer,
} from '@invana/canvas-react';
import type { GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import type { MenuItem } from '@invana/ui';

import { Inspector, lesMisData, ThemeToggle } from '../_demo';

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
  render: () => (
    <GraphCanvasApp
      data={lesMisData()}
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
        right: (ctx) => <ThemeToggle ctx={ctx} />,
      }}
      footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
    >
      {/* Extra layers — beyond the bundle. */}
      <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
      <DevInfoLayer enabled />

      {/* Extra behaviours — inspector + label level-of-detail. */}
      <Inspector />
      <LabelResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

      {/* Right-click menus. */}
      <GraphClipboardProvider layerId="graph">
        <GraphNodeContextMenu items={nodeMenu} />
        <GraphBackgroundContextMenu items={backgroundMenu} />
      </GraphClipboardProvider>
    </GraphCanvasApp>
  ),
};
