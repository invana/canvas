/**
 * **User card** built-in composite node type (`userCard` from `@invana/graph`)
 * — an avatar profile card: avatar disc + initials, status dot, name + role, a
 * divider, and Lucide contact rows, with a top accent bar that follows the
 * rounded corners (`clip`). The card is the shared builder; the story just
 * feeds it data via a `shape` resolver. Whole-card hover / select + crisp text
 * (label-resolution LOD) come for free.
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
  userCard,
  type GraphNode,
  type UserCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/User Card' };
export default meta;
type Story = StoryObj;

export const UserCard: Story = {
  render: () => createContainer({ id: 'composite-user-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'u1', position: { x: -300, y: 0 }, data: { name: 'Ada Lovelace', role: 'Mathematician', initials: 'AL', avatar: 0x6366f1, status: 'online', email: 'ada@analytical.co', phone: '+44 20 7946 0958' } satisfies UserCardData },
      { type: 'node', id: 'u2', position: { x: 0, y: 0 }, data: { name: 'Alan Turing', role: 'Computer Scientist', initials: 'AT', avatar: 0x0ea5e9, status: 'away', email: 'alan@enigma.io', phone: '+44 16 3555 0142' } satisfies UserCardData },
      { type: 'node', id: 'u3', position: { x: 300, y: 0 }, data: { name: 'Grace Hopper', role: 'Rear Admiral', initials: 'GH', avatar: 0xec4899, status: 'offline', email: 'grace@cobol.mil', phone: '+1 202 555 0173' } satisfies UserCardData },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-user-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape: (n) => userCard(n.data as UserCardData), bgStrokeWidth: 0 } } } }));

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
