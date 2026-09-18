/**
 * **Event card** built-in composite node type (`eventCard` from
 * `@invana/graph`) — a solid accent date chip (day over short month) beside a
 * two-line title, then one meta row per present detail: time, venue,
 * attendance.
 *
 * `day` / `month` are **pre-formatted strings, not a `Date`** — the card does
 * no locale or timezone work, so the caller decides how a date reads. Like the
 * organisation card it auto-sizes: the last node has no time, venue or
 * attendance, so it drops the divider and the meta block altogether.
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
  eventCard,
  type GraphEdge,
  type GraphNode,
  type EventCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Event Card' };
export default meta;
type Story = StoryObj;

export const EventCard: Story = {
  render: () => createContainer({ id: 'composite-event-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'ev1', position: { x: -300, y: 0 }, data: { title: 'Graph Rendering Deep Dive', day: '14', month: 'Sep', time: '18:00 – 20:00', venue: 'Hall B, Bengaluru', attendees: '128 going', accent: 0xa855f7 } satisfies EventCardData },
      { type: 'node', id: 'ev2', position: { x: 0, y: 0 }, data: { title: 'WebGPU Performance Workshop', day: '21', month: 'Sep', time: '09:30 – 17:00', venue: 'Studio 4', accent: 0x0ea5e9 } satisfies EventCardData },
      { type: 'node', id: 'ev3', position: { x: 300, y: 0 }, data: { title: 'Layout Algorithms Roundtable', day: '02', month: 'Oct', attendees: '42 going', accent: 0x22c55e } satisfies EventCardData },
      // No time, venue or attendance — no divider, no meta block, the shortest card.
      { type: 'node', id: 'ev4', position: { x: 0, y: 220 }, data: { title: 'Date to be announced', day: '—', month: 'TBD', accent: 0x64748b } satisfies EventCardData },
    ];

    // A schedule reads as a chain: each event follows the previous one.
    const edges: GraphEdge[] = [
      { type: 'edge', id: 'e1', source: 'ev1', target: 'ev2' },
      { type: 'edge', id: 'e2', source: 'ev2', target: 'ev3' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-event-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape: (n) => eventCard(n.data as EventCardData), bgStrokeWidth: 0 } },
          edge: { style: { strokeColor: 0x475569, strokeWidth: 1.4, strokeDashArray: [5, 4] } }
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
