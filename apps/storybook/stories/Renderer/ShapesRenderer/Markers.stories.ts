import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  WorldLayer,
  ShapesRenderer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

const meta: Meta = {
  title: 'Canvas/Renderer/Markers',
};
export default meta;
type Story = StoryObj;

class GenericLayer extends WorldLayer {
  renderer!: ShapesRenderer;
  protected createState() { return {}; }
  protected override onMount(ctx: CanvasContext): void {
    this.renderer = new ShapesRenderer({ subLayer: this.subLayer, camera: ctx.camera });
  }
  hitTest() { return null; }
}

// Markers are standalone connectors with raw coordinate endpoints (kind:'point').
// Built-in marker kinds: 'arrow', 'circle', 'square', 'diamond'.
// sourceMarker draws at the start of the line; targetMarker draws at the end.
// MarkerOptions: color (hex number), size (px), alpha (0–1).
const connectors = [
  {
    id: 'edge-arrow',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y:  90 },
    target: { kind: 'point', x: 400, y:  90 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 14 },
  },
  {
    id: 'edge-circle',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 210 },
    target: { kind: 'point', x: 400, y: 210 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'circle',
    targetMarkerOptions: { color: 0x374151, size: 14 },
  },
  {
    id: 'edge-square',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 330 },
    target: { kind: 'point', x: 400, y: 330 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'square',
    targetMarkerOptions: { color: 0x374151, size: 14 },
  },
  {
    id: 'edge-diamond',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 450 },
    target: { kind: 'point', x: 400, y: 450 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'diamond',
    targetMarkerOptions: { color: 0x374151, size: 14 },
  },
  {
    // Both ends: sourceMarker at start, targetMarker at end, different colors
    id: 'edge-both',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 570 },
    target: { kind: 'point', x: 400, y: 570 },
    stroke: 0x374151,
    strokeWidth: 2,
    sourceMarker: 'arrow',
    sourceMarkerOptions: { color: 0x2563eb, size: 14 },
    targetMarker: 'diamond',
    targetMarkerOptions: { color: 0xdc2626, size: 14 },
  },
];

export const Markers: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new GenericLayer({ id: 'markers', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of connectors) {
        layer.renderer.addConnector(id, spec as never);
      }
    });

    return container;
  },
};
