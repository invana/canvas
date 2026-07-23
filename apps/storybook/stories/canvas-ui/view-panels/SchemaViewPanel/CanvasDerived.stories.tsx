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

import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp, GraphControlsToolbar, SchemaViewPanel, ThemeToggle, ToolbarItems } from '@invana/canvas-ui';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ontology } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/SchemaViewPanel/CanvasDerived' };
export default meta;
type Story = StoryObj;

export const CanvasDerived: Story = {
  // name: 'Canvas-derived schema',
  render: () => {
    // `showSchema` mounts/unmounts the right region — `GraphCanvasApp`'s control
    // context (handed to header slots) exposes the theme but not region visibility.
    const [showSchema, setShowSchema] = useState(true);

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

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          onReady={(c) => c?.showMessage('Schema derived from the loaded graph · switch Nodes / Layout / Edges in its toolbar')}
          header={{
            title: 'SchemaViewPanel · derived',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <div className="flex items-center gap-1">
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'toggle',
                      key: 'schema-panel',
                      icon: PanelRightOpen,
                      activeIcon: PanelRightClose,
                      label: 'Show schema',
                      activeLabel: 'Hide schema',
                      active: showSchema,
                      onToggle: () => setShowSchema((v) => !v),
                    },
                  ]}
                />
                <ThemeToggle ctx={ctx} />
              </div>
            ),
          }}
          right={
            showSchema
              ? {
                  content: ({ canvas }) => (
                    <SchemaViewPanel canvas={canvas} layouts={layouts} layoutLabels={layoutLabels} defaultLayout="elk" />
                  ),
                  defaultSize: '420px',
                  maxSize: '560px',
                  collapsible: true,
                }
              : undefined
          }
        />
      </ThemeProvider>
    );
  },
};
