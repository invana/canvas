/**
 * **Stat / KPI card** built-in composite node type (`statCard` from
 * `@invana/graph`) — a dashboard metric tile: a left accent bar (following the
 * rounded corners via `clip`), a caption, an accent-tinted icon chip, a large
 * value, and a coloured trend-delta row. The card is the shared builder; the
 * story just feeds it data.
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
  statCard,
  type GraphNode,
  type StatCardData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Types/Composite Shapes/Stat Card' };
export default meta;
type Story = StoryObj;

export const StatCard: Story = {
  render: () => createContainer({ id: 'composite-stat-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 's1', position: { x: -240, y: 0 }, data: { label: 'Revenue', value: '$48.2k', delta: '+12.5%', trend: 'up', icon: 'lucide/dollar-sign', accent: 0x22c55e } satisfies StatCardData },
      { id: 's2', position: { x: 0, y: 0 }, data: { label: 'Active Users', value: '3,914', delta: '+4.1%', trend: 'up', icon: 'lucide/users', accent: 0x3b82f6 } satisfies StatCardData },
      { id: 's3', position: { x: 240, y: 0 }, data: { label: 'Churn', value: '2.3%', delta: '-0.8%', trend: 'down', icon: 'lucide/trending-down', accent: 0xf43f5e } satisfies StatCardData },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-stat-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape: (n) => statCard(n.data as StatCardData), bgStrokeWidth: 0 } } } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true }));

    await canvas.init({ container, autoResize: true });
    const graph = canvas.layers.get('graph') as GraphLayer;
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
