/**
 * Per-type hover preview cards — different fields by element `type`, driven
 * entirely by the **serializable `cards` setting** (no render-props, no custom
 * components). A `person` node shows an avatar + bio + email; a `company` node
 * shows industry + HQ + headcount; a `WORKS_AT` edge shows its own fields.
 *
 * This is the shape a settings UI produces: `cards.nodes[type]` /
 * `cards.edges[type]`, each a plain `HoverElementPreviewCardSpec`. The built-in
 * card renderer paints whatever the matched spec resolves to.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  HoverElementPreviewBehaviour,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphNode, HoverElementPreviewCardsByType } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/behaviours/HoverElementPreviewPerType' };
export default meta;
type Story = StoryObj;

// ─── Data — two node types (person / company) + a typed edge ─────────────────

const data: GraphData = {
  nodes: [
    { id: 'ada', type: 'person', position: { x: -180, y: -60 }, data: { name: 'Ada Lovelace', role: 'Mathematician', bio: 'Credited as the first computer programmer for her work on the Analytical Engine.', email: 'ada@analytical.engine', avatar: 'https://i.pravatar.cc/96?img=5' } },
    { id: 'grace', type: 'person', position: { x: 10, y: -120 }, data: { name: 'Grace Hopper', role: 'Computer Scientist', bio: 'Popularised machine-independent programming languages.', email: 'grace@cobol.dev', avatar: 'https://i.pravatar.cc/96?img=47' } },
    { id: 'alan', type: 'person', position: { x: -60, y: 110 }, data: { name: 'Alan Turing', role: 'Computer Scientist', bio: 'Pioneer of theoretical computer science and AI.', email: 'alan@turing.machine', avatar: 'https://i.pravatar.cc/96?img=12' } },
    { id: 'acme', type: 'company', position: { x: 190, y: 30 }, data: { name: 'Acme Computing', industry: 'Hardware', hq: 'Cambridge, UK', employees: 1200 } },
    { id: 'globex', type: 'company', position: { x: 150, y: 150 }, data: { name: 'Globex Corp', industry: 'Software', hq: 'New York, US', employees: 4300 } },
  ],
  edges: [
    { id: 'ada-acme', source: 'ada', target: 'acme', type: 'WORKS_AT', data: { since: 1842 } },
    { id: 'grace-globex', source: 'grace', target: 'globex', type: 'WORKS_AT', data: { since: 1959 } },
    { id: 'alan-acme', source: 'alan', target: 'acme', type: 'WORKS_AT', data: { since: 1936 } },
  ],
};

// ─── The serializable per-type card config (a settings UI would produce this) ─

const cards: HoverElementPreviewCardsByType = {
  nodes: {
    person: {
      image: { field: 'data.avatar', shape: 'circle' },
      title: { field: 'data.name' },
      subtitle: { field: 'data.bio', maxLines: 2 },
      rows: [
        { label: 'Role', field: 'data.role' },
        { label: 'Email', field: 'data.email' },
      ],
    },
    company: {
      title: { field: 'data.name' },
      subtitle: { field: 'data.industry' },
      rows: [
        { label: 'HQ', field: 'data.hq' },
        { label: 'Employees', field: 'data.employees' },
      ],
    },
  },
  edges: {
    WORKS_AT: {
      title: { field: 'type' },
      rows: [{ label: 'Since', field: 'data.since' }],
    },
  },
};

// ─── Story ───────────────────────────────────────────────────────────────────

export const HoverElementPreviewPerType: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <Canvas>
        <BackgroundLayer id="background" type="pattern" patternType="dots" backgroundColor="#0b1220" color="#1e293b" />
        <GraphLayer
          id="graph"
          data={data}
          node={{
            style: {
              // Colour + shape by type so person vs company read differently.
              shape: (n: GraphNode) =>
                (n.type === 'company'
                  ? { kind: 'rect', width: 54, height: 36, radius: 6 }
                  : { kind: 'circle', radius: 24 }),
              bgFill: (n: GraphNode) => (n.type === 'company' ? 0xf59e0b : 0x6366f1),
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelText: (n: GraphNode) => (n.data as { name: string }).name.split(' ')[0]!,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center',
            },
          }}
          edge={{ style: { strokeColor: 0x64748b, strokeWidth: 2 } }}
        />

        <DragPanBehaviour id="pan" enabled />
        <WheelZoomBehaviour id="zoom" enabled />

        {/* Per-type cards — the built-in renderer paints whatever the matched
            spec resolves to. No render-props; everything here is serializable. */}
        <HoverElementPreviewBehaviour targetLayerId="graph" cards={cards} />
      </Canvas>
    </div>
  ),
};
