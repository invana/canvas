import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';
import { RendererLayer } from '../_shared/GenericLayer';
import { createContainer } from '../div-util';

const meta: Meta = { title: 'Canvas/HelloCanvas' };
export default meta;
type Story = StoryObj;

export const HelloCanvas: Story = {
  render: () => createContainer({ id: 'cvs-hello-canvas' }),

  play: async ({ canvasElement }) => {
    const CIRCLE = { x: 200, y: 200, r: 30 };
    const SQUARE = { x: 420, y: 165, w: 50, h: 50 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-hello-canvas')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch', enabled: true }));
    canvas.behaviours.register(new KeyboardCameraInputBehaviour({ id: 'keyboard-camera', enabled: true }));

    const connectorsLayer = new RendererLayer({ id: 'connectors', options: {} });
    canvas.layers.add(connectorsLayer);

    connectorsLayer.renderer.addConnector('edge-1', {
      kind: 'line',
      router: 'straight',
      source: { kind: 'point', x: CIRCLE.x + CIRCLE.r, y: CIRCLE.y },
      target: { kind: 'point', x: SQUARE.x, y: SQUARE.y + SQUARE.h / 2 },
      stroke: 0x374151,
      strokeWidth: 2,
      cap: 'round',
      targetMarker: 'arrow',
      targetMarkerOptions: { color: 0x374151, size: 12 },
    });

    const shapesLayer = new RendererLayer({ id: 'shapes', options: {} });
    canvas.layers.add(shapesLayer);

    shapesLayer.renderer.addShape('circle', {
      kind: 'circle',
      x: CIRCLE.x,
      y: CIRCLE.y,
      r: CIRCLE.r,
      fill: 0x4f9cf9,
      stroke: 0x2563eb,
      strokeWidth: 2,
    });

    shapesLayer.renderer.addShape('square', {
      kind: 'rect',
      x: SQUARE.x,
      y: SQUARE.y,
      width: SQUARE.w,
      height: SQUARE.h,
      fill: 0x10b981,
      stroke: 0x065f46,
      strokeWidth: 2,
    });

    canvas.camera.fitContent(shapesLayer.getBounds(), 100);
  },
};
