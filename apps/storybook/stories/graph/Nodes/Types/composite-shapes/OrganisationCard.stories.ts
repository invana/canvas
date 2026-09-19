/**
 * **Organisation card** built-in composite node type (`organisationCard` from
 * `@invana/graph`) — a logo chip (a Lucide icon, or a monogram when there's no
 * logo) beside the organisation name and an entity-type tag, a divider, then
 * one meta row per present detail: location, headcount, founding note.
 *
 * The card **auto-sizes to its data**: a fully-populated organisation is tall,
 * one with a single meta row is shorter, and one with none drops the divider
 * entirely — an absent field leaves no gap. The four nodes below are ordered
 * most- to least-populated so the height difference is the point of the story.
 * Edges connect a parent body to its members.
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
  OrganisationCard as OrganisationCardBuilder,
  type GraphEdge,
  type GraphNode,
  type OrganisationCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Organisation Card' };
export default meta;
type Story = StoryObj;

export const OrganisationCard: Story = {
  render: () => createContainer({ id: 'composite-organisation-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      // All three meta rows — the tallest card.
      { type: 'node', id: 'cern', position: { x: 0, y: -180 }, data: { name: 'CERN', kind: 'Research', logo: 'lucide/atom', location: 'Geneva, Switzerland', headcount: '2,600 staff', founded: 'est. 1954', accent: 0x0ea5e9 } satisfies OrganisationCardData },
      // Two meta rows.
      { type: 'node', id: 'cam', position: { x: -320, y: 60 }, data: { name: 'Univ. of Cambridge', kind: 'University', monogram: 'UC', location: 'Cambridge, UK', founded: 'est. 1209', accent: 0xa855f7 } satisfies OrganisationCardData },
      // One meta row.
      { type: 'node', id: 'bell', position: { x: 0, y: 60 }, data: { name: 'Bell Labs', kind: 'Industrial R&D', logo: 'lucide/radio-tower', founded: 'est. 1925', accent: 0xf59e0b } satisfies OrganisationCardData },
      // None — no divider, no meta block, the shortest card.
      { type: 'node', id: 'skunk', position: { x: 320, y: 60 }, data: { name: 'Skunk Works', kind: 'Advanced Projects', monogram: 'SW', accent: 0x22c55e } satisfies OrganisationCardData },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'e1', source: 'cern', target: 'cam' },
      { type: 'edge', id: 'e2', source: 'cern', target: 'bell' },
      { type: 'edge', id: 'e3', source: 'cern', target: 'skunk' },
    ];

    // Squared-off chips for this story: `chipRadius` is an ordinary spec
    // field, so no subclassing — the stock default is a full pill.
    const card = new OrganisationCardBuilder({ chipRadius: 1 });

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-organisation-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape: (n) => card.build(n.data as OrganisationCardData), bgStrokeWidth: 0 } },
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
