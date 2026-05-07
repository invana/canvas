import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
  WorldLayer,
  ShapesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer } from '../div-util';

const meta: Meta = { title: 'Canvas/HelloCanvas' };
export default meta;
type Story = StoryObj;

export const HelloCanvas: Story = {
  render: () => createContainer({ id: 'cvs-hello-canvas' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: ShapesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new ShapesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const CIRCLE = { x: 200, y: 200, r: 30 };
    const SQUARE = { x: 420, y: 200, w: 50, h: 50 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-hello-canvas')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch', enabled: true }));
    canvas.behaviours.register(new KeyboardCameraInputBehaviour({ id: 'keyboard-camera', enabled: true }));

    const connectorsLayer = new RenderLayer({ id: 'connectors', options: {}, zIndex: 2 });
    canvas.layers.add(connectorsLayer);

    connectorsLayer.renderer.addConnector('edge-1', {
      kind: 'line',
      router: 'straight',
      source: { kind: 'point', x: CIRCLE.x + CIRCLE.r + 2, y: CIRCLE.y },
      target: { kind: 'point', x: SQUARE.x - SQUARE.w / 2 -2, y: SQUARE.y },
      stroke: 0x374151,
      strokeWidth: 2,
      cap: 'round',
      targetMarker: arrowMarkerSpec(12, { color: 0x374151 }),
    });

    const shapesLayer = new RenderLayer({ id: 'shapes', options: {}, zIndex: 1 });
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

    canvas.camera.fitContent(shapesLayer.getBounds(), 200);
  },
};
