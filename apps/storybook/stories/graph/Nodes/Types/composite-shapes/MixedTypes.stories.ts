/**
 * **Every composite node type in one graph** — the catalogue in use rather than
 * one type at a time. A single `GraphLayer` renders eight different composite
 * node types by **dispatching on `node.type`** inside the `shape` resolver:
 *
 * ```ts
 * const shapeByType = { organisation: (n) => organisationCard(n.data), … };
 * node: { style: { shape: (n) => (shapeByType[n.type] ?? fallback)(n) } }
 * ```
 *
 * That is the whole integration story. Every card is a plain builder from
 * `@invana/graph` that turns one node's `data` into a `CompositeShapeOption`,
 * so a heterogeneous graph needs no per-type layer, no custom renderer and no
 * subclassing — just a map from type to builder. Cards auto-size independently,
 * so rows of different heights coexist, and hover / select / drag work across
 * all of them uniformly.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  IDCard,
  OrganisationCard,
  ProductCard,
  TaskCard,
  eventCard,
  schemaTableCard,
  statCard,
  userCard,
  type CompositeShapeOption,
  type EventCardData,
  type GraphEdge,
  type GraphNode,
  type IDCardData,
  type OrganisationCardData,
  type ProductCardData,
  type SchemaTableData,
  type StatCardData,
  type TaskCardData,
  type UserCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Mixed Types' };
export default meta;
type Story = StoryObj;

export const MixedTypes: Story = {
  render: () => createContainer({ id: 'composite-mixed-types' }),

  play: async ({ canvasElement }) => {
    // One organisation, and everything that hangs off it — each a different
    // composite node type, all in one layer.
    const nodes: GraphNode[] = [
      { type: 'organisation', id: 'org', position: { x: -80, y: -300 }, data: { name: 'Analytical Engine Co', kind: 'Engineering', logo: 'lucide/building-2', location: 'London, UK', headcount: '240 staff', founded: 'est. 1837', accent: 0x6366f1 } satisfies OrganisationCardData },
      { type: 'stat', id: 'kpi', position: { x: -420, y: -290 }, data: { label: 'Active nodes', value: '12,480', delta: '+8.2%', trend: 'up', icon: 'lucide/activity', accent: 0x22c55e } satisfies StatCardData },
      { type: 'event', id: 'ev', position: { x: 260, y: -300 }, data: { title: 'Graph Rendering Deep Dive', day: '14', month: 'Sep', time: '18:00 – 20:00', venue: 'Hall B', attendees: '128 going', accent: 0xa855f7 } satisfies EventCardData },
      { type: 'person', id: 'badge', position: { x: -440, y: -40 }, data: { name: 'Ada Lovelace', title: 'Principal Analyst', idNumber: 'ID 4471-2290', org: 'Analytical Engine Co', photo: 'lucide/user-round', validUntil: 'Valid until 2027-01-31', status: 'active', accent: 0x6366f1 } satisfies IDCardData },
      { type: 'user', id: 'profile', position: { x: -440, y: 200 }, data: { name: 'Grace Hopper', role: 'Rear Admiral', initials: 'GH', avatar: 0xec4899, status: 'online', email: 'grace@cobol.mil', phone: '+1 202 555 0173' } satisfies UserCardData },
      { type: 'product', id: 'prod', position: { x: 280, y: -30 }, data: { title: 'Mechanical Keyboard, 87-key', price: '$149.00', icon: 'lucide/keyboard', rating: 4.6, reviews: 128, stock: 'in', tags: [{ label: 'Wireless', color: 0x22c55e }], accent: 0xf59e0b } satisfies ProductCardData },
      { type: 'task', id: 'task', position: { x: 280, y: 250 }, data: { title: 'Split the renderer package', priority: 'high', tags: [{ label: 'Infra', color: 0x3b82f6 }], assignee: { initials: 'RM', color: 0x0ea5e9 }, due: 'Sep 30' } satisfies TaskCardData },
      { type: 'table', id: 'schema', position: { x: -80, y: 40 }, data: { label: 'employees', icon: 'lucide/users', header: 0x7c3aed, fields: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'string' }, { name: 'hired_at', type: 'date' }] } satisfies SchemaTableData },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'e1', source: 'org', target: 'kpi' },
      { type: 'edge', id: 'e2', source: 'org', target: 'ev' },
      { type: 'edge', id: 'e3', source: 'org', target: 'badge' },
      { type: 'edge', id: 'e4', source: 'org', target: 'prod' },
      { type: 'edge', id: 'e5', source: 'org', target: 'schema' },
      { type: 'edge', id: 'e6', source: 'badge', target: 'profile' },
      { type: 'edge', id: 'e7', source: 'prod', target: 'task' },
    ];

    // Squared-off chips throughout: `chipRadius` is an ordinary spec field on
    // every card that draws one, so one option restyles them all.
    const CHIP = { chipRadius: 1 };
    const org = new OrganisationCard(CHIP);
    const badge = new IDCard(CHIP);
    const product = new ProductCard(CHIP);
    const task = new TaskCard(CHIP);

    // ── The integration: one map from node.type to a card builder ──────────
    const shapeByType: Record<string, (node: GraphNode) => CompositeShapeOption> = {
      organisation: (n) => org.build(n.data as OrganisationCardData),
      stat: (n) => statCard(n.data as StatCardData),
      event: (n) => eventCard(n.data as EventCardData),
      person: (n) => badge.build(n.data as IDCardData),
      user: (n) => userCard(n.data as UserCardData),
      product: (n) => product.build(n.data as ProductCardData),
      task: (n) => task.build(n.data as TaskCardData),
      table: (n) => schemaTableCard(n.data as SchemaTableData),
    };
    // An unknown type still renders — it degrades to a bare stat tile.
    const fallback = (n: GraphNode): CompositeShapeOption => statCard({ label: n.type, value: n.id, accent: 0x64748b });
    const shape = (n: GraphNode): CompositeShapeOption => (shapeByType[n.type] ?? fallback)(n);

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-mixed-types')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape, bgStrokeWidth: 0 } },
          edge: { style: { strokeColor: 0x475569, strokeWidth: 1.4, arrowTargetShape: 'none', shape: { pathType: 'orth' } } }
        }
      }),
    );

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true }));

    await canvas.init({ container, autoResize: true });
    const graph = canvas.layers.get('graph') as GraphLayer;
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
