/**
 * **ID card** built-in composite node type (`idCard` from `@invana/graph`) — an
 * identity / access badge: an accent header band carrying the issuing
 * organisation, a photo chip (a Lucide icon, or the holder's initials when
 * there's no photo), the name + title, a divider, then the badge number and a
 * status pill. The header runs edge to edge and follows the rounded corners
 * via `clip`.
 *
 * The three badges show the status vocabulary (`active` / `expired` /
 * `suspended`) and both photo-chip modes. Whole-card hover / select + crisp
 * text (label-resolution LOD) come for free.
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
  idCard,
  type GraphNode,
  type IDCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/ID Card' };
export default meta;
type Story = StoryObj;

export const IDCard: Story = {
  render: () => createContainer({ id: 'composite-id-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'b1', position: { x: -300, y: 0 }, data: { name: 'Ada Lovelace', title: 'Principal Analyst', idNumber: 'ID 4471-2290', org: 'Analytical Engine Co', photo: 'lucide/user-round', validUntil: 'Valid until 2027-01-31', status: 'active', accent: 0x6366f1 } satisfies IDCardData },
      { type: 'node', id: 'b2', position: { x: 0, y: 0 }, data: { name: 'Alan Turing', title: 'Cryptanalysis Lead', idNumber: 'ID 1912-0623', org: 'Bletchley Park', initials: 'AT', validUntil: 'Expired 2025-06-07', status: 'expired', accent: 0x0ea5e9 } satisfies IDCardData },
      { type: 'node', id: 'b3', position: { x: 300, y: 0 }, data: { name: 'Grace Hopper', title: 'Rear Admiral', idNumber: 'ID 1906-1209', org: 'US Navy', initials: 'GH', validUntil: 'Under review', status: 'suspended', accent: 0xec4899 } satisfies IDCardData },
      // No org, no status, no validity — the card drops the header text and the pill.
      { type: 'node', id: 'b4', position: { x: 0, y: 220 }, data: { name: 'Unbadged Visitor', idNumber: 'ID —', accent: 0x64748b } satisfies IDCardData },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-id-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape: (n) => idCard(n.data as IDCardData), bgStrokeWidth: 0 } } } }));

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
