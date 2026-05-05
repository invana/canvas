import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Connectors' };
export default meta;
type Story = StoryObj;

export const Connectors: Story = {
  render: () => createContainer({ id: 'cvs-connectors' }),

  play: async ({ canvasElement }) => {
    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { kind: 'point' as const, x: 80, y: 200 };
    const TGT = { kind: 'point' as const, x: 480, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-connectors')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'connectors', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#374151',
      strokeWidth: 2,
      marker: 'arrow' as 'arrow' | 'circle' | 'diamond' | 'none',
    };

    function buildSpec() {
      return {
        kind: settings.kind,
        router: settings.router,
        source: SRC,
        target: TGT,
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        ...(settings.marker !== 'none' ? {
          targetMarker: settings.marker,
          targetMarkerOptions: { color: toHex(settings.strokeColor), size: 12 },
        } : {}),
      };
    }

    layer.renderer.addConnector('edge', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Connector' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(redraw);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'marker', ['none', 'arrow', 'circle', 'diamond']).onChange(redraw);
  },
};
