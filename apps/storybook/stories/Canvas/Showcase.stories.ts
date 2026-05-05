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

const meta: Meta = { title: 'Canvas/Showcase' };
export default meta;
type Story = StoryObj;

export const Showcase: Story = {
  render: () => createContainer({ id: 'cvs-showcase' }),

  play: async ({ canvasElement }) => {
    function hexagonPoints(radius: number): Array<{ x: number; y: number }> {
      return Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
      });
    }

    function starPathCommands(outer: number, inner: number) {
      const cmds: Array<{ kind: 'moveTo' | 'lineTo'; x: number; y: number } | { kind: 'close' }> = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        cmds.push({ kind: i === 0 ? 'moveTo' : 'lineTo', x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      cmds.push({ kind: 'close' });
      return cmds;
    }

    const shapesData = [
      { id: 'circle',  kind: 'circle',  x: 100, y: 100, r: 40,                              fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 },
      { id: 'rect',    kind: 'rect',    x: 220, y: 70,  width: 100, height: 60, cornerRadius: 8, fill: 0x10b981, stroke: 0x065f46, strokeWidth: 2 },
      { id: 'ellipse', kind: 'ellipse', x: 390, y: 100, rx: 55, ry: 35,                      fill: 0xf59e0b, stroke: 0x92400e, strokeWidth: 2 },
      { id: 'polygon', kind: 'polygon', x: 520, y: 100, points: hexagonPoints(40),           fill: 0xa855f7, stroke: 0x6b21a8, strokeWidth: 2 },
      { id: 'path',    kind: 'path',    x: 640, y: 100, commands: starPathCommands(40, 18),  fill: 0xef4444, stroke: 0x7f1d1d, strokeWidth: 2 },
      { id: 'text',    kind: 'text',    x: 730, y: 90,  text: 'Hello canvas',               style: { fill: 0x111827, fontSize: 18, fontWeight: '600' } },
      { id: 'src-1',   kind: 'circle',  x: 100, y: 260, r: 10, fill: 0x2563eb },
      { id: 'tgt-1',   kind: 'circle',  x: 350, y: 300, r: 10, fill: 0xdc2626 },
      { id: 'src-2',   kind: 'circle',  x: 100, y: 400, r: 10, fill: 0x2563eb },
      { id: 'tgt-2',   kind: 'circle',  x: 350, y: 440, r: 10, fill: 0xdc2626 },
      { id: 'src-3',   kind: 'circle',  x: 100, y: 540, r: 10, fill: 0x2563eb },
      { id: 'tgt-3',   kind: 'circle',  x: 350, y: 580, r: 10, fill: 0xdc2626 },
      { id: 'src-4',   kind: 'circle',  x: 100, y: 680, r: 10, fill: 0x2563eb },
      { id: 'tgt-4',   kind: 'circle',  x: 350, y: 720, r: 10, fill: 0xdc2626 },
    ];

    const connectorsData = [
      { id: 'edge-1', kind: 'line',  router: 'straight',    source: { kind: 'shape', shapeId: 'src-1' }, target: { kind: 'shape', shapeId: 'tgt-1' }, stroke: 0x374151, strokeWidth: 2, targetMarker: 'arrow',   targetMarkerOptions: { color: 0x374151, size: 12 } },
      { id: 'edge-2', kind: 'line',  router: 'orthogonal',  source: { kind: 'shape', shapeId: 'src-2' }, target: { kind: 'shape', shapeId: 'tgt-2' }, stroke: 0x374151, strokeWidth: 2, targetMarker: 'circle',  targetMarkerOptions: { color: 0x374151, size: 12 } },
      { id: 'edge-3', kind: 'curve', router: 'bezier',      source: { kind: 'shape', shapeId: 'src-3' }, target: { kind: 'shape', shapeId: 'tgt-3' }, stroke: 0x374151, strokeWidth: 2, targetMarker: 'diamond', targetMarkerOptions: { color: 0x374151, size: 12 } },
      { id: 'edge-4', kind: 'curve', router: 'straight',    source: { kind: 'shape', shapeId: 'src-4' }, target: { kind: 'shape', shapeId: 'tgt-4' }, stroke: 0x374151, strokeWidth: 2, targetMarker: 'square',  targetMarkerOptions: { color: 0x374151, size: 12 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-showcase')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch', enabled: true }));
    canvas.behaviours.register(new KeyboardCameraInputBehaviour({ id: 'keyboard-camera', enabled: true }));

    const layer = new RendererLayer({ id: 'showcase', options: {} });
    canvas.layers.add(layer);

    shapesData.forEach(({ id, ...props }) => layer.renderer.addShape(id, props as never));
    connectorsData.forEach(({ id, ...props }) => layer.renderer.addConnector(id, props as never));
    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
