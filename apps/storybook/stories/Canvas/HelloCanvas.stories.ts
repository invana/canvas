import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';
import { RendererLayer } from '../_shared/GenericLayer';

const meta: Meta = {
  title: 'Canvas/HelloCanvas',
};
export default meta;

type Story = StoryObj;

// Circle center and square geometry — shared between both layers so the
// connector endpoints align with the visible shape boundaries.
const CIRCLE = { x: 200, y: 200, r: 30 };
const SQUARE = { x: 420, y: 165, w: 50, h: 50 };

export const HelloCanvas: Story = {
  render: () => {

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });
      const pan = new DragPanBehaviour({ id: 'pan', enabled: true, });
      const zoom = new WheelZoomBehaviour({ id: 'zoom', enabled: true });
      const pinch = new PinchZoomBehaviour({ id: 'pinch', enabled: true });
      const keyboard = new KeyboardCameraInputBehaviour({ id: 'keyboard-camera', enabled: true });
      canvas.behaviours.register(pan);       
      canvas.behaviours.register(zoom);    
      canvas.behaviours.register(pinch); 
      canvas.behaviours.register(keyboard); 
      
      // ── Connectors layer (below nodes) ────────────────────────────────
      const connectorsLayer = new RendererLayer({ id: 'connectors', options: {} });
      canvas.layers.add(connectorsLayer);

      connectorsLayer.renderer.addConnector('edge-1', {
        kind: 'line',
        router: 'straight',
        // right edge of circle → left edge of square
        source: { kind: 'point', x: CIRCLE.x + CIRCLE.r, y: CIRCLE.y },
        target: { kind: 'point', x: SQUARE.x, y: SQUARE.y + SQUARE.h / 2 },
        stroke: 0x374151,
        strokeWidth: 2,
        cap: 'round',
        targetMarker: 'arrow',
        targetMarkerOptions: { color: 0x374151, size: 12 },
      });

      // ── Shapes layer (above connectors) ───────────────────────────────
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
    });

    return container;
  },
};
