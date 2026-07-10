/**
 * **Task card** built-in composite node type (`taskCard` from `@invana/graph`)
 * — a Kanban card: a wrapped title, a priority pill + coloured tag chips, a
 * divider, and a footer (assignee avatar + due date), with a bottom accent bar
 * (priority colour) that follows the rounded corners via `clip`. The card is the
 * shared builder; the story just feeds it data.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  taskCard,
  type GraphNode,
  type TaskCardData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Types/Composite Shapes/Task Card' };
export default meta;
type Story = StoryObj;

export const TaskCard: Story = {
  render: () => createContainer({ id: 'composite-task-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 't1', position: { x: -260, y: 0 }, data: { title: 'Fix WebGPU fallback crash on Safari', priority: 'high', tags: [{ label: 'Bug', color: 0xf43f5e }, { label: 'Renderer', color: 0x8b5cf6 }], assignee: { initials: 'RM', color: 0x0ea5e9 }, due: 'Jul 12' } satisfies TaskCardData },
      { id: 't2', position: { x: 0, y: 0 }, data: { title: 'Composite icon part documentation', priority: 'med', tags: [{ label: 'Docs', color: 0x3b82f6 }], assignee: { initials: 'AL', color: 0x6366f1 }, due: 'Jul 18' } satisfies TaskCardData },
      { id: 't3', position: { x: 260, y: 0 }, data: { title: 'Schema editor: reorder fields', priority: 'low', tags: [{ label: 'Feature', color: 0x22c55e }, { label: 'UI', color: 0xf59e0b }], assignee: { initials: 'GH', color: 0xec4899 }, due: 'Jul 22' } satisfies TaskCardData },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-task-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape: (n) => taskCard(n.data as TaskCardData), bgStrokeWidth: 0 } } } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new LabelResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true }));

    await canvas.init({ container, autoResize: true });
    const graph = canvas.layers.get('graph') as GraphLayer;
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
