import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Markers' };
export default meta;
type Story = StoryObj;

const toHex = (s: string) => parseInt(s.slice(1), 16);

export const Markers: Story = {
  render: () => createContainer({ id: 'cvs-markers' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-markers')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'markers', options: {} });
    canvas.layers.add(layer);

    const settings = {
      markerKind: 'arrow' as 'arrow' | 'circle' | 'square' | 'diamond',
      markerSize: 14,
      strokeColor: '#374151',
      strokeWidth: 2,
      bothEnds: false,
    };

    function buildSpec() {
      const color = toHex(settings.strokeColor);
      return {
        kind: 'line',
        router: 'straight',
        source: { kind: 'point' as const, x: 80, y: 200 },
        target: { kind: 'point' as const, x: 480, y: 200 },
        stroke: color,
        strokeWidth: settings.strokeWidth,
        targetMarker: settings.markerKind,
        targetMarkerOptions: { color, size: settings.markerSize },
        ...(settings.bothEnds ? {
          sourceMarker: settings.markerKind,
          sourceMarkerOptions: { color, size: settings.markerSize },
        } : {}),
      };
    }

    layer.renderer.addConnector('edge', buildSpec() as never);

    function redraw() {
      layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Markers' });
    gui.add(settings, 'markerKind', ['arrow', 'circle', 'square', 'diamond']).onChange(redraw);
    gui.add(settings, 'markerSize', 4, 32, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'bothEnds').onChange(redraw);
  },
};
