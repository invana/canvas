/**
 * `<HoverElementPreview>` for `@invana/canvas-react` — hover preview with **custom**
 * node / edge cards.
 *
 * The turnkey owns **all** the wiring — subscription, anchoring (measure → flip
 * → clamp), and the interactive hold-open behaviour. To render bespoke cards,
 * supply `renderNode` / `renderEdge`; the card components are pure UI and never
 * deal with positioning or hold/release.
 *
 * The cards here are `@invana/canvas-ui`'s presentational `NodePreviewCard` /
 * `EdgePreviewCard` (design-kit chrome). The story only maps `target.data` → the
 * card props.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { EdgePreviewCard, NodePreviewCard, type PreviewCardRow } from '@invana/canvas-ui';
import {
  BackgroundLayer,
  Canvas,
  DragNodeBehaviour,
  DragPanBehaviour,
  HoverElementPreviewBehaviour,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/behaviours/HoverElementPreview' };
export default meta;
type Story = StoryObj;

// ─── Data ────────────────────────────────────────────────────────────────────

interface PersonData {
  name: string;
  role: string;
  description: string;
  email: string;
  score: number;
  avatar: string;
}
interface RelationData {
  description: string;
  weight: number;
}

const data: GraphData = {
  nodes: [
    { id: 'ada', type: 'Person', position: { x: -180, y: -70 }, data: { name: 'Ada Lovelace', role: 'Mathematician', description: 'Credited as the first computer programmer for her work on the Analytical Engine.', email: 'ada@analytical.engine', score: 0.98, avatar: 'https://i.pravatar.cc/96?img=5' } },
    { id: 'alan', type: 'Person', position: { x: 20, y: -130 }, data: { name: 'Alan Turing', role: 'Computer Scientist', description: 'Pioneer of theoretical computer science and artificial intelligence.', email: 'alan@turing.machine', score: 0.99, avatar: 'https://i.pravatar.cc/96?img=12' } },
    { id: 'grace', type: 'Person', position: { x: 190, y: -50 }, data: { name: 'Grace Hopper', role: 'Computer Scientist', description: 'Popularised machine-independent programming languages.', email: 'grace@cobol.dev', score: 0.95, avatar: 'https://i.pravatar.cc/96?img=47' } },
    { id: 'edsger', type: 'Person', position: { x: -90, y: 110 }, data: { name: 'Edsger Dijkstra', role: 'Computer Scientist', description: 'Foundational contributions to algorithms and structured programming.', email: 'edsger@shortest.path', score: 0.93, avatar: 'https://i.pravatar.cc/96?img=33' } },
    { id: 'katherine', type: 'Person', position: { x: 120, y: 130 }, data: { name: 'Katherine Johnson', role: 'Mathematician', description: 'Orbital-mechanics calculations critical to early US crewed spaceflight.', email: 'katherine@orbit.nasa', score: 0.97, avatar: 'https://i.pravatar.cc/96?img=20' } },
  ],
  edges: [
    { id: 'ada-alan', source: 'ada', target: 'alan', type: 'INFLUENCED', data: { description: 'Foundational ideas carried forward into modern computing.', weight: 0.7 } },
    { id: 'alan-grace', source: 'alan', target: 'grace', type: 'COLLABORATED_WITH', data: { description: 'Worked toward practical, programmable computing.', weight: 0.6 } },
    { id: 'ada-edsger', source: 'ada', target: 'edsger', type: 'INFLUENCED', data: { description: 'Algorithmic rigour and structured thinking.', weight: 0.8 } },
    { id: 'edsger-katherine', source: 'edsger', target: 'katherine', type: 'COLLABORATED_WITH', data: { description: 'Numerical methods for real-world problems.', weight: 0.5 } },
    { id: 'grace-katherine', source: 'grace', target: 'katherine', type: 'COLLABORATED_WITH', data: { description: 'Applied computation at scale.', weight: 0.65 } },
  ],
};

// ─── target → card-props mappers (the only consumer-side glue) ───────────────

function renderNode(node: GraphNode) {
  const d = node.data as PersonData;
  // Tags = the node's labels (a Neo4j multi-label `type` split on ':') + its role.
  const tags = [...(node.type ?? '').split(':').filter(Boolean), d.role];
  const rows: PreviewCardRow[] = [
    { label: 'id', value: node.id, mono: true },
    { label: 'Email', value: d.email },
    { label: 'Score', value: `${Math.round(d.score * 100)}%` },
  ];
  return (
    <NodePreviewCard image={d.avatar} title={d.name} subtitle={d.description} tags={tags} rows={rows} />
  );
}

function renderEdge(edge: GraphEdge) {
  const d = edge.data as RelationData;
  // `source` / `target` come straight off the GraphEdge record — no data hack.
  const rows: PreviewCardRow[] = [
    { label: 'source', value: edge.source, mono: true },
    { label: 'target', value: edge.target, mono: true },
    { label: 'weight', value: d.weight.toFixed(2) },
    { label: 'id', value: edge.id, mono: true },
  ];
  return (
    <EdgePreviewCard
      badge={edge.type}
      title={`${edge.source} → ${edge.target}`}
      subtitle={d.description}
      rows={rows}
    />
  );
}

// ─── Story ───────────────────────────────────────────────────────────────────

export const HoverElementPreview: Story = {
  render: () => (
    <div style={{ height: '100vh' }}>
      <Canvas>
        <BackgroundLayer id="background" type="pattern" patternType="dots" backgroundColor="#0b1220" color="#1e293b" />
        <GraphLayer
          id="graph"
          data={data}
          node={{
            style: {
              shape: { kind: 'circle', radius: 24 },
              bgFill: 0x6366f1,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelText: (n: GraphNode) => (n.data as PersonData).name.split(' ')[0]!,
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

        {/* The component owns subscription + positioning + hold-open; we supply
            only the card content per kind. Timing uses the behaviour defaults
            (openDelay / closeDelay = 50ms). */}
        <HoverElementPreviewBehaviour targetLayerId="graph" renderNode={renderNode} renderEdge={renderEdge} />
      </Canvas>
    </div>
  ),
};
