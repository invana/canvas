/**
 * Per-type hover preview — a **different card per element `type`**, chosen in the
 * `renderNode` / `renderEdge` render-props. Hover a **person** node → an avatar
 * card (name / bio / role / email); hover a **company** node → a no-image card
 * (industry / HQ / headcount); hover a **WORKS_AT** edge → an edge card.
 *
 * A **canvas-react** story, so the scene stays bare — a `<Canvas>` root, no
 * `GraphCanvasApp`, no header/footer/panels. The one canvas-ui touch is the
 * render-prop **content**: canvas-ui's presentational `NodePreviewCard` /
 * `EdgePreviewCard`. Branch on `node.type` / `edge.type` to build a distinct card
 * per kind — the story maps `target.data` → the card props.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { EdgePreviewCard, NodePreviewCard, type PreviewCardRow } from '@invana/canvas-ui';
import {
  BackgroundLayer,
  Canvas,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  HoverElementPreviewBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/behaviours/HoverElementPreviewBehaviour/HoverElementPreviewPerType' };
export default meta;
type Story = StoryObj;

// ─── Data — two node types (person / company) + a typed edge ─────────────────

interface PersonData {
  name: string;
  role: string;
  bio: string;
  email: string;
  avatar: string;
}
interface CompanyData {
  name: string;
  industry: string;
  hq: string;
  employees: number;
}

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

// ─── Per-type card content — a distinct card built for each element type ──────

// Person → avatar card: image + bio + role/email rows.
function personCard(node: GraphNode) {
  const d = node.data as PersonData;
  const rows: PreviewCardRow[] = [
    { label: 'id', value: node.id, mono: true },
    { label: 'Email', value: d.email },
  ];
  return <NodePreviewCard image={d.avatar} title={d.name} subtitle={d.bio} tags={[d.role]} rows={rows} />;
}

// Company → no-image card: industry subtitle + HQ / headcount rows.
function companyCard(node: GraphNode) {
  const d = node.data as CompanyData;
  const rows: PreviewCardRow[] = [
    { label: 'HQ', value: d.hq },
    { label: 'Employees', value: d.employees.toLocaleString() },
  ];
  return <NodePreviewCard title={d.name} subtitle={d.industry} tags={['Company']} rows={rows} />;
}

// The render-prop picks the card by `node.type` — two visibly different cards.
function renderNode(node: GraphNode) {
  return node.type === 'company' ? companyCard(node) : personCard(node);
}

function renderEdge(edge: GraphEdge) {
  const since = (edge.data as { since: number }).since;
  const rows: PreviewCardRow[] = [
    { label: 'source', value: edge.source, mono: true },
    { label: 'target', value: edge.target, mono: true },
    { label: 'Since', value: String(since) },
  ];
  return <EdgePreviewCard badge={edge.type} title={`${edge.source} → ${edge.target}`} rows={rows} />;
}

// ─── Story ───────────────────────────────────────────────────────────────────

export const HoverElementPreviewPerTypeStory: Story = {
  name: 'HoverElementPreviewPerType',
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="background" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
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
        <DragNodeBehaviour targetLayerId="graph" enabled />

        {/* Per-type content — the render-prop branches on `node.type` / `edge.type`
            and returns a distinct card, so a person and a company preview differently. */}
        <HoverElementPreviewBehaviour targetLayerId="graph" renderNode={renderNode} renderEdge={renderEdge} />
      </Canvas>
    </div>
  ),
};
