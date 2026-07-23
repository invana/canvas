/**
 * **Canvas-derived schema.** A right-docked **`<SchemaViewPanel canvas={…}>`** over a
 * small **company knowledge graph** (company · person · product · location ·
 * industry): it derives the *schema* — which node types exist, how many of each,
 * which edge types connect which, and each type's property keys — **straight from
 * the loaded store** and renders it as an interactive metagraph. Nothing is
 * authored; the panel scans the store's nodes/edges (bucketing by `type`) and
 * recomputes reactively as data loads.
 *
 * Its **`<SchemaToolbar>`** switches Nodes (Simple discs ⇄ ER **Table** cards) ·
 * Layout (Hierarchical/ELK ⇄ Force) · Edges (Straight · Orthogonal · Curved) ·
 * Fit. Hover a type to highlight its 1st-degree neighbours (built in). The header's
 * right cluster carries a schema-panel toggle + theme switcher.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevInfoLayer, MiniMapLayer } from '@invana/canvas-react';
import type { GraphCanvas } from '@invana/graph';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  SchemaViewPanel,
  ToolbarItems,
  useSidePanels,
} from '@invana/canvas-ui';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ontology } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Gauge, Map, Moon, PanelRightClose, PanelRightOpen, Sun } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/SchemaViewPanel/CanvasDerived' };
export default meta;
type Story = StoryObj;

export const CanvasDerived: Story = {
  // name: 'Canvas-derived schema',
  render: () => {
    // Map the knowledge graph → GraphNode/GraphEdge, promoting each element's
    // `data.kind` to its `type` — that single field drives both the app's
    // colour-by-type behaviour AND the schema's bucketing. Memoised so the panel
    // toggle's re-render doesn't hand `GraphCanvasApp` a new object and reload it.
    const data = useMemo(
      () => ({
        nodes: ontology.nodes.map((n) => ({ id: n.id, type: n.data.kind, data: n.data })),
        edges: ontology.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.data.kind,
          data: e.data,
        })),
      }),
      [],
    );

    // Inject the layouts — the consumer owns the layout packages; `SchemaViewPanel`
    // imports none. ELK (layered) is the default (a schema reads best as a hierarchy).
    const layouts = useMemo(
      () => ({
        elk: () => new ElkLayout({ algorithm: 'layered', direction: 'DOWN', nodeSpacing: 60, layerSpacing: 90 }),
        force: () =>
          new D3ForceLayout({ charge: { strength: -280 }, link: { distance: 140 }, collide: {}, animate: false }),
      }),
      [],
    );
    const layoutLabels = useMemo(() => ({ elk: 'Hierarchical', force: 'Force' }), []);

    // The header toggle + docked region for the schema panel (icon flips
    // open ⇄ close). `render` passes the live engine — the panel derives its
    // schema from the loaded store.
    const dock = useSidePanels(
      [
        {
          id: 'schema',
          icon: PanelRightOpen,
          activeIcon: PanelRightClose,
          label: 'Schema',
          render: (c) => (
            <SchemaViewPanel canvas={c} layouts={layouts} layoutLabels={layoutLabels} defaultLayout="elk" />
          ),
        },
      ],
      { defaultOpenId: 'schema', section: { defaultSize: '420px', maxSize: '560px' } },
    );

    // Screen-fixed overlays driven as toolbar items (own their on-state; the
    // layers render as GraphCanvasApp children below, gated on it).
    const [minimapOn, setMinimapOn] = useState(true);
    const [devOn, setDevOn] = useState(false);

    const onReady = useCallback(
      (c: GraphCanvas | null) =>
        c?.showMessage('Schema derived from the loaded graph · switch Nodes / Layout / Edges in its toolbar'),
      [],
    );

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={onReady}
          header={{
            title: 'SchemaViewPanel · derived',
            center: <GraphControlsToolbar />,
            // One shared toolbar — the schema toggle plus minimap / dev-overlay /
            // theme, all as items.
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  ...dock.items,
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: Map,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v),
                  },
                  {
                    type: 'toggle',
                    key: 'devinfo',
                    icon: Gauge,
                    label: 'Dev overlay: off',
                    activeLabel: 'Dev overlay: on',
                    active: devOn,
                    onToggle: () => setDevOn((v) => !v),
                  },
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
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={dock.region}
        >
          {/* Screen-fixed overlays driven by the header toggle items above. */}
          {minimapOn && <MiniMapLayer backgroundLayerId="background" position="bottom-left" />}
          {devOn && <DevInfoLayer enabled corner="top-left" margin={{ x: 12, y: 48 }} />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
