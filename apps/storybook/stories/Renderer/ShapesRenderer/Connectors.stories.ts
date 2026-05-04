import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { RendererLayer } from '../../_shared/GenericLayer';

const meta: Meta = {
  title: 'Canvas/Renderer/Connectors',
};
export default meta;
type Story = StoryObj;

// Connectors are standalone — source and target are raw coordinates (kind:'point').
// No shapes required. Useful for lines, arrows, swim-lane dividers, etc.
// router controls path geometry; kind (line/curve) controls how the polyline is stroked.
const connectors = [
  {
    // line connector + straight router: direct segment between two points
    id: 'edge-line-straight',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 100 },
    target: { kind: 'point', x: 400, y: 100 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // line connector + orthogonal router: source and target at different y → L-shaped elbow
    id: 'edge-line-orthogonal',
    kind: 'line',
    router: 'orthogonal',
    source: { kind: 'point', x:  80, y: 240 },
    target: { kind: 'point', x: 400, y: 290 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // line connector + bezier router: router emits a dense polyline → smooth arc
    id: 'edge-line-bezier',
    kind: 'line',
    router: 'bezier',
    source: { kind: 'point', x:  80, y: 400 },
    target: { kind: 'point', x: 400, y: 450 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // curve connector + bezier router: quadratic smoothing rounds the arc further
    id: 'edge-curve-bezier',
    kind: 'curve',
    router: 'bezier',
    source: { kind: 'point', x:  80, y: 570 },
    target: { kind: 'point', x: 400, y: 620 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
];

export const Connectors: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new RendererLayer({ id: 'connectors', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of connectors) {
        layer.renderer.addConnector(id, spec as never);
      }
    });

    return container;
  },
};
