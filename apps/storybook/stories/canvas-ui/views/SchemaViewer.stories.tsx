/**
 * **The graph's schema, live.** A right-docked **`<SchemaViewer>`** over a small
 * **company knowledge graph** (five entity kinds — company · person · product ·
 * location · industry — linked by typed relationships): it derives the graph's
 * *schema* (which node types exist, how many of each, which edge types connect
 * which, and each type's property keys) straight from the live store and renders
 * it as an interactive **metagraph** in its own nested `<GraphCanvas>`.
 *
 * Its top **`<SchemaToolbar>`** switches:
 *   - **Nodes** — Simple discs ⇄ composite **ER table** cards (header = type,
 *     one row per property);
 *   - **Layout** — Hierarchical (ELK) ⇄ Force (d3);
 *   - **Edges** — connector routing: Straight · Orthogonal · Curved;
 *   - **Fit** — fit the metagraph to view.
 *
 * Nothing is authored — the panel scans the store's nodes/edges and buckets them
 * by type (here `data.kind`, which the story maps to each element's `type`); the
 * schema recomputes reactively as data loads, coalesced to one pass per frame.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp, GraphControlsToolbar, SchemaViewer } from '@invana/canvas-ui';
import { ontology } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/views/SchemaViewer' };
export default meta;
type Story = StoryObj;

export const SchemaViewerStory: Story = {
  name: 'SchemaViewer',
  render: () => {
    // Map the knowledge graph → GraphNode/GraphEdge, promoting each element's
    // `data.kind` to its `type`. That single field drives both the app's
    // colour-by-type behaviour AND the schema's bucketing (the default accessors
    // read `node.type` / `edge.type` first).
    const data = {
      nodes: ontology.nodes.map((n) => ({ id: n.id, type: n.data.kind, data: n.data })),
      edges: ontology.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.data.kind,
        data: e.data,
      })),
    };
    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Schema on the right — switch Nodes / Layout / Edges from its toolbar')}
          header={{ title: 'SchemaViewer', center: <GraphControlsToolbar /> }}
          // Docked into the app's resizable `right` region — `content` is a
          // render-fn handed the live control context, so the view gets the
          // engine straight from `ctx.canvas` (null until ready — the view and its
          // nested canvas handle that themselves).
          right={{
            content: ({ canvas }) => <SchemaViewer canvas={canvas} />,
            defaultSize: '420px',
            maxSize: '560px',
            collapsible: true,
          }}
        />
      </ThemeProvider>
    );
  },
};
