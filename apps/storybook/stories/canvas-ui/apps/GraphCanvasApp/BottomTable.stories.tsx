/**
 * `<GraphCanvasApp>` with a **bottom data-table region** — the collapsible
 * `AppLayoutV2` `bottom` section under the canvas, projecting the graph's nodes as
 * a scrollable table (a stand-in for the real `DataStore`-backed table). No right
 * region here, so the table's **span** is the star: `bottomSpan="full"` stretches
 * it across the entire width under the canvas.
 *
 * `bottomSpan` picks which columns the panel underlaps — `'full'` (whole width),
 * `'main-right'` (canvas + right panel, the default), or `'main'` (canvas only,
 * with any right panel running full-height beside it). Drag the handle to resize;
 * it collapses too.
 *
 * Contrast with `SideRegions`, which pairs a right panel *and* a bottom table with
 * `bottomSpan="main-right"`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, ThemeToggle } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BottomTable' };
export default meta;
type Story = StoryObj;

// Community `group` → node `type`, plus a per-node degree (appearance count) so the
// table has a couple of meaningful columns.
const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;
const DEGREE = new Map<string, number>();
for (const e of lesMiserables.edges) {
  DEGREE.set(e.source, (DEGREE.get(e.source) ?? 0) + 1);
  DEGREE.set(e.target, (DEGREE.get(e.target) ?? 0) + 1);
}
const DATA = {
  nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
  edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
};

// The bottom region — a data table projecting the graph's nodes. A plain
// scrollable table stands in for the real `DataStore`-backed grid.
const bottomTable = (
  <div className="h-full overflow-auto text-xs text-foreground">
    <table className="w-full border-collapse">
      <thead className="sticky top-0 bg-background">
        <tr className="text-left text-muted-foreground">
          <th className="px-3 py-1.5 font-medium">Character</th>
          <th className="px-3 py-1.5 font-medium">Community</th>
          <th className="px-3 py-1.5 font-medium">Co-appearances</th>
        </tr>
      </thead>
      <tbody>
        {[...DATA.nodes]
          .sort((a, b) => (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0))
          .map((n) => (
            <tr key={n.id} className="border-t border-border">
              <td className="px-3 py-1">{n.id}</td>
              <td className="px-3 py-1">{n.type}</td>
              <td className="px-3 py-1 tabular-nums">{DEGREE.get(n.id) ?? 0}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

export const BottomTable: Story = {
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider>.
    <ThemeProvider>
      <GraphCanvasApp
        data={DATA}
        onReady={(c) => c?.showMessage('Drag the table handle to resize · it collapses too')}
        header={{
          title: 'Bottom Table',
          center: <GraphControlsToolbar />,
          right: (ctx) => <ThemeToggle ctx={ctx} />,
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        // The bottom region spans the full width (no right region to share with).
        bottom={{ content: bottomTable, defaultSize: 30, minSize: 12, collapsible: true }}
        bottomSpan="full"
      />
    </ThemeProvider>
  ),
};
