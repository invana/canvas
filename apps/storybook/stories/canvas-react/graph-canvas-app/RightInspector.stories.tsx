/**
 * `<GraphCanvasApp>` driving its **right region as a live inspector** — the docked,
 * resizable `AppLayoutV2` `right` section reacting to canvas selection. Click a
 * node (or edge) and its details fill the panel; clear the selection and the panel
 * falls back to an empty-state hint.
 *
 * The wiring is the clean split the app is built for: a `<ClickViewBehaviour>`
 * child reports the viewed element up via `onView`, the story holds it in state,
 * and that state renders the `right` bag's `content`. Unlike `FullFeatured` — which
 * floats an overlay `<Panel>` over the canvas via the behaviour's `panel` prop —
 * here the detail lives in the **docked** side region, so it resizes / collapses
 * with the layout and never covers the graph.
 *
 * Contrast with `SideRegions` (static right + bottom content) — this one is driven
 * by what you click.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClickViewBehaviour, type ViewContext } from '@invana/canvas-react';
import { EdgeDetailView, GraphCanvasApp, GraphControlsToolbar, NodeDetailView, PanelContent, ThemeToggle } from '@invana/canvas-ui';
import type { GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/RightInspector' };
export default meta;
type Story = StoryObj;

// Community `group` → node `type`; edges are `APPEARS_WITH`. This gives the
// inspector's Type row a real value and colours nodes by community.
const groupOf = (n: GraphNode): number => (n.data as { group?: number } | undefined)?.group ?? 0;
const DATA = {
  nodes: lesMiserables.nodes.map((n) => ({ ...n, type: `Group ${groupOf(n)}` })),
  edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
};

/** The app + the state bridge between the click behaviour and the right region. */
function RightInspectorApp() {
  // The currently-viewed node / edge (or null when nothing is selected).
  const [view, setView] = useState<ViewContext | null>(null);

  // The right region's body: the detail surface when something is viewed, an
  // empty-state hint otherwise. `PanelContent` owns the header bar + close ✕; the
  // AppLayoutV2 right section already provides the resizable/collapsible container.
  const rightPanel = view ? (
    <PanelContent
      header={view.kind === 'edge' ? 'Edge Detail' : 'Node Detail'}
      onClose={view.close}
      fill
    >
      {view.kind === 'edge' ? <EdgeDetailView ctx={view} /> : <NodeDetailView ctx={view} />}
    </PanelContent>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
      <span className="text-2xl">👆</span>
      <span>Click a node or edge to inspect it here.</span>
    </div>
  );

  return (
    <GraphCanvasApp
      data={DATA}
      onReady={(c) => c?.showMessage('Click a node to inspect it in the right panel')}
      header={{
        title: 'Right Inspector',
        center: <GraphControlsToolbar />,
        right: (ctx) => <ThemeToggle ctx={ctx} />,
      }}
      // The docked, resizable right region — its content is driven by selection.
      right={{ content: rightPanel, defaultSize: 24, minSize: 16, collapsible: true }}
    >
      {/* Report the viewed element up; the story renders it into `right`. No
          `panel` prop here, so the behaviour draws no overlay of its own. */}
      <ClickViewBehaviour id="click-view" targetLayerId="graph" onView={setView} />
    </GraphCanvasApp>
  );
}

export const RightInspector: Story = {
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider>.
    <ThemeProvider>
      <RightInspectorApp />
    </ThemeProvider>
  ),
};
