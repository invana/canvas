/**
 * `<GraphCanvasApp>` with the new **side regions** (built on `@invana/themes`
 * `AppLayoutV2`):
 *
 *   - **`right`** — a resizable / collapsible panel beside the canvas: the home
 *     for settings, node / edge detail, and editors. Here it's a simple details
 *     surface (dataset stats).
 *   - **`bottom`** — a collapsible panel under the canvas: a **data table**
 *     projecting the graph's nodes (a placeholder for the real `DataStore`-backed
 *     table). `bottomSpan="main-right"` stretches it under the canvas *and* the
 *     right panel.
 *
 * There is deliberately **no left rail** — a single-canvas graph app doesn't need
 * nav / file-tree chrome. Drag the panel handles to resize; both collapse.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, ThemeToggle } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/graph-canvas-app/SideRegions' };
export default meta;
type Story = StoryObj;

export const SideRegions: Story = {
  render: () => {
    // Les Misérables ships no `type` — in a graph DB every node/edge carries a
    // label (its "type"). Each node's community `group` becomes its type; edges
    // are `APPEARS_WITH`.
    const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;
    const data = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    // Right region — a simple details / settings-style surface. Plain content (no
    // engine needed); a real app drops the settings panel / node-edge editors here.
    const rightPanel = (
      <div className="flex h-full flex-col gap-3 p-3 text-sm text-foreground">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Details
        </div>
        <div className="flex justify-between">
          <span>Nodes</span>
          <span>{data.nodes.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Edges</span>
          <span>{data.edges.length}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          The right region is the home for settings, node / edge detail, and editors. Drag its
          handle to resize; it collapses too.
        </p>
      </div>
    );

    // Bottom region — a data table projecting the graph's nodes. A placeholder for
    // the real `DataStore`-backed table; here it's a plain scrollable table.
    const bottomTable = (
      <div className="h-full overflow-auto text-xs text-foreground">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-1.5 font-medium">Id</th>
              <th className="px-3 py-1.5 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.nodes.map((n) => (
              <tr key={n.id} className="border-t border-border">
                <td className="px-3 py-1">{n.id}</td>
                <td className="px-3 py-1">{n.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it via useTheme() (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) =>
            c?.showMessage('Drag the panel handles to resize · both regions collapse')
          }
          header={{
            title: 'Side Regions',
            center: <GraphControlsToolbar />,
            right: (ctx) => <ThemeToggle ctx={ctx} />,
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The new resizable/collapsible side regions. Omitting either hides it.
          right={{ content: rightPanel, defaultSize: 22, minSize: 15, collapsible: true }}
          bottom={{ content: bottomTable, defaultSize: 28, minSize: 12, collapsible: true }}
          bottomSpan="main-right"
        />
      </ThemeProvider>
    );
  },
};
