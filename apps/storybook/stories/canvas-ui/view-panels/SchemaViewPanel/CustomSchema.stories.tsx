/**
 * **Custom (externally-sourced) schema.** A right-docked
 * **`<SchemaViewPanel schema={…}>`** rendering an **explicit `GraphSchema`** — *not*
 * derived from the loaded graph. This is the Neo4j / GraphQL / ontology case: the
 * data source knows its **full schema** (all labels, relationship types, property
 * keys), which is a *superset* of what's actually loaded in the canvas.
 *
 * Here the main graph loads a small company knowledge graph, but the schema panel
 * shows a richer authored schema — with types the graph doesn't contain
 * (**investor**, **award**), a self-loop (**competes_with**), a multi-target edge
 * (**received**: company→award *and* person→award), and parallel person→company
 * edges. `SchemaViewPanel` takes `schema` **or** `canvas`, never both (the type
 * enforces it); with `schema` set, no canvas is needed.
 */

import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp, GraphControlsToolbar, SchemaViewPanel, ThemeToggle } from '@invana/canvas-ui';
import type { GraphSchema } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ontology } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/view-panels/SchemaViewPanel/CustomSchema' };
export default meta;
type Story = StoryObj;

export const CustomSchema: Story = {
  // name: 'Custom schema',
  render: () => {
    // The loaded graph (a subset) — the schema panel is independent of it.
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

    // An explicit, authored schema — as an adapter would hand back from a graph DB.
    // Richer than the loaded graph (extra types, a self-loop, a multi-target edge).
    const schema: GraphSchema = useMemo(
      () => ({
        nodeTypes: [
          { name: 'company', count: 42, properties: [
            { name: 'name', type: 'string' }, { name: 'founded', type: 'number' }, { name: 'valuation', type: 'number' },
          ] },
          { name: 'person', count: 128, properties: [
            { name: 'name', type: 'string' }, { name: 'role', type: 'string' },
          ] },
          { name: 'product', count: 76, properties: [
            { name: 'name', type: 'string' }, { name: 'category', type: 'string' }, { name: 'launched', type: 'number' },
          ] },
          { name: 'investor', count: 34, properties: [
            { name: 'name', type: 'string' }, { name: 'fund', type: 'string' }, { name: 'aum', type: 'number' },
          ] },
          { name: 'location', count: 19, properties: [
            { name: 'name', type: 'string' }, { name: 'country', type: 'string' },
          ] },
          { name: 'industry', count: 11, properties: [{ name: 'name', type: 'string' }] },
          { name: 'award', count: 8, properties: [{ name: 'name', type: 'string' }, { name: 'year', type: 'number' }] },
        ],
        edgeTypes: [
          { name: 'founded', count: 51, connections: [{ from: 'person', to: 'company', count: 51 }] },
          { name: 'ceo_of', count: 42, connections: [{ from: 'person', to: 'company', count: 42 }] },
          { name: 'works_at', count: 210, connections: [{ from: 'person', to: 'company', count: 210 }] },
          { name: 'builds', count: 76, connections: [{ from: 'company', to: 'product', count: 76 }] },
          { name: 'invested_in', count: 88, connections: [{ from: 'investor', to: 'company', count: 88 }] },
          { name: 'headquartered_in', count: 42, connections: [{ from: 'company', to: 'location', count: 42 }] },
          { name: 'operates_in', count: 60, connections: [{ from: 'company', to: 'industry', count: 60 }] },
          { name: 'competes_with', count: 24, connections: [{ from: 'company', to: 'company', count: 24 }] },
          { name: 'received', count: 13, connections: [
            { from: 'company', to: 'award', count: 8 }, { from: 'person', to: 'award', count: 5 },
          ] },
        ],
      }),
      [],
    );

    const layouts = useMemo(
      () => ({
        elk: () => new ElkLayout({ algorithm: 'layered', direction: 'DOWN', nodeSpacing: 60, layerSpacing: 90 }),
        force: () =>
          new D3ForceLayout({ charge: { strength: -280 }, link: { distance: 140 }, collide: {}, animate: false }),
      }),
      [],
    );
    const layoutLabels = useMemo(() => ({ elk: 'Hierarchical', force: 'Force' }), []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Right panel shows an explicit schema (superset of the loaded graph)')}
          header={{
            title: 'SchemaViewPanel · custom',
            center: <GraphControlsToolbar />,
            right: (ctx) => <ThemeToggle ctx={ctx} />,
          }}
          right={{
            // The docked panel ignores the app's engine — it renders the explicit
            // `schema` (so `canvas` must not be passed; the union type enforces it).
            content: () => (
              <SchemaViewPanel schema={schema} layouts={layouts} layoutLabels={layoutLabels} defaultLayout="elk" />
            ),
            defaultSize: '440px',
            maxSize: '600px',
            collapsible: true,
          }}
        />
      </ThemeProvider>
    );
  },
};
