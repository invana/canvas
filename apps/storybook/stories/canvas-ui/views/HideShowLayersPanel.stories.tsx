/**
 * **Hide / show driven by a live UI panel.** The flagship demo of first-class
 * per-element + whole-layer visibility feeding React UI:
 *
 *   - a right-docked **`<TabbedPanel>`** whose **Layers** tab hosts the
 *     `@invana/canvas-ui` **`<LayersPanelView>`** (layer eyes + nodes/edges by
 *     type + right-click Hide/Show), and whose **Hidden** tab hosts the
 *     **`<HiddenElementsView>`** — the reusable list of currently-hidden elements
 *     with per-item + "Show all" restore,
 *   - the full **`<GraphControlsToolbar>`** in the header (layout · zoom/fit ·
 *     **select-mode** · grid · …) so you can marquee/lasso-select, and
 *   - the standard **`<GraphContextMenu>`** — right-click any node/edge for
 *     Focus · Select · **Hide/Show**, zero config.
 *
 * Both `HiddenElementsView` and `GraphContextMenu` recompute off the store's
 * `node:visibility` / `edge:visibility` stream — on change, not per render.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasContext } from '@invana/canvas-react';
import { GraphCanvasApp, GraphContextMenu, GraphControlsToolbar, HiddenElementsView, LayersPanelView } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';
import { TabbedPanel, type TabConfig } from '@invana/ui';
import { EyeOff, Layers } from 'lucide-react';
import { useContext } from 'react';

const meta: Meta = { title: 'canvas-ui/views/HideShowLayersPanel' };
export default meta;
type Story = StoryObj;

/**
 * The docked right-region body — a TabbedPanel whose Layers tab hosts the
 * `LayersPanelView` and whose Hidden tab hosts the `HiddenElementsView`. It
 * renders inside `GraphCanvasApp`'s resizable `right` section (a **sibling** of
 * `<Canvas>`, under the lifted context), so it guards for the canvas being `null`
 * before the engine is ready — read the context directly and bail to `null`. The
 * section supplies the resizable container; the panel just fills it.
 */
function VisibilityTabbedPanel() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  const tabs: TabConfig[] = [
    { value: 'layers', label: 'Layers', icon: Layers, content: <LayersPanelView canvas={canvas} /> },
    { value: 'hidden', label: 'Hidden', icon: EyeOff, content: <HiddenElementsView canvas={canvas} /> },
  ];
  return (
    <TabbedPanel
      tabs={tabs}
      defaultTab="hidden"
      className="flex h-full flex-col overflow-hidden bg-card"
      bodyClassName="min-h-0 flex-1 overflow-hidden"
    />
  );
}

const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;

export const HideShowLayersPanel: Story = {
  render: () => {
    // Give every node/edge a `type` so the LayersPanelView groups them meaningfully.
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };
    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Right-click an element to Hide/Show · Layers / Hidden tabs on the right')}
          // The full graph toolbar — the select-mode picker (click / brush / lasso)
          // lets you select before hiding via the right-click menu.
          header={{ title: 'HiddenElementsView', center: <GraphControlsToolbar /> }}
          // Docked into the app's resizable `right` region — no floating Panel.
          right={{ content: <VisibilityTabbedPanel />, defaultSize: '340px', maxSize: '460px', collapsible: true }}
        >
          {/* Standard right-click menu (Focus · Select · Hide/Show) — a sibling of
              the bundle, resolved from the <Canvas> context. `nodeItems`/`edgeItems`
              receive `(ctx, defaults)`: spread `defaults` to keep the standard
              items and add your own around them. */}
          <GraphContextMenu
            nodeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'inspect',
                label: `Inspect ${ctx.id}`,
                // eslint-disable-next-line no-alert
                onClick: () => window.alert(`Node ${ctx.id}\n${JSON.stringify(ctx.data)}`),
              },
            ]}
            edgeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'log-edge',
                label: 'Log edge to console',
                onClick: () => console.log('edge', ctx.id, ctx.data),
              },
            ]}
          />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
