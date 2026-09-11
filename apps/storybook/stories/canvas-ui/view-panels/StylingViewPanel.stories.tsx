/**
 * **Styling per type on this canvas.** A header-toggled, right-docked
 * **`<StylingViewPanel>`** over the ~20-service **microservices** topology: one row
 * per node type (`gateway` · `api` · `logic` · `data` · `external`) carrying a
 * colour swatch, a **label key** picked from the node's own addressable fields
 * (`id` · `type` · `data.tier` · `data.health` · `data.rps`), and a size; one row per edge type (`CALLS`)
 * carrying colour + width. The type list is read live from `useDerivedSchema`, so it
 * fills in as the data lands and would grow if more arrived.
 *
 * The panel is **controlled for persistence, live for painting**: `value` in, a whole
 * serialisable `TypeStylingPatch` out of `onChange`, and the panel itself applies the
 * patch to the layer. **This story is the host** only in the sense that it holds the
 * patch in React state — the stand-in for Invana's persisted canvas record. There is
 * no painting code here: the panel installs the per-type fields as template
 * resolvers, so an edit lands immediately and nodes arriving later are styled too.
 *
 * Note the nodes carry **no per-node `labelText` / `shape`** — per-node style sits
 * *above* the layer template in `resolveNodeStyle`, so baking a label into each node
 * would out-rank the panel and the label picker would appear to do nothing. The base
 * look lives on the layer template instead, which is the level the panel writes.
 *
 * Two node types open pre-styled (`data` slate + labelled by `data.tier`, `logic`
 * violet), so the panel opens showing the difference between a styled row — which
 * carries a **↺ reset** — and a default one.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { D3ForceLayout } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  StylingViewPanel,
  ToolbarItems,
  useSidePanels,
  type TypeStylingPatch
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { microservices } from '@invana/graph-datasets/usecase-demos';
import { Moon, Paintbrush, Sun } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/StylingViewPanel' };
export default meta;
type Story = StoryObj;

/** What the story opens with — the panel's `value` on first paint. */
const SEED: TypeStylingPatch = {
  nodeTypes: {
    data: { color: '#9ca3af', labelKey: 'data.tier' },
    logic: { color: '#8b5cf6' }
  }
};

export const StylingViewPanelStory: Story = {
  name: 'StylingViewPanel',
  render: function Render() {
    // The patch lives here because the host owns it — this is the React-state
    // stand-in for Invana's persisted canvas record.
    const [styling, setStyling] = useState<TypeStylingPatch>(SEED);

    const dock = useSidePanels(
      [
        {
          id: 'styling',
          icon: Paintbrush,
          label: 'Styling',
          render: (c) => (
            <StylingViewPanel
              canvas={c}
              value={styling}
              onChange={setStyling}
            />
          )
        },
      ],
      { defaultOpenId: 'styling', section: { defaultSize: '320px', maxSize: '420px' } },
    );

    // Tier is the node *type* — that is what the panel styles — and each node
    // keeps its dataset fields as `data`, which is where the label-property
    // choices come from. Memoised so a re-render never re-seeds the canvas.
    const data = useMemo<GraphData>(
      () => ({
        nodes: microservices.nodes.map((n) => ({
          id: n.id,
          type: n.data.tier,
          data: n.data,
        })),
        edges: microservices.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'CALLS',
          data: e.data,
          style: { strokeWidth: 1.2, strokeAlpha: 0.7, arrowTargetShape: 'triangle', arrowTargetSize: 6 }
        }))
      }),
      [],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        activeLayout: 'force',
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.6 },
          // Base look on the LAYER TEMPLATE, not per node — the panel writes at
          // this level, so anything baked onto a node would out-rank it.
          graph: {
            node: { style: { shape: { kind: 'circle', radius: 13 }, labelPlacement: 'bottom', labelFontSize: 10 } }
          }
        },
        behaviours: { color: { enabled: false }, 'click-select': { enabled: true } },
        layouts: { force: { charge: { strength: -520 }, link: { distance: 120 }, collide: {}, animate: false } }
      }),
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      // No seeding pass: the panel applies its opening `value` itself.
      c?.showMessage('Styling panel on the right — colour · label key · size, per type');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'StylingViewPanel',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        <D3ForceLayout id="force" targetLayerId="graph" />
      </GraphCanvasApp>
    );
  }
};
