import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/Glow' };
export default meta;
type Story = StoryObj;

export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-glow' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);

    const starLocal = [
      { x: 0, y: -70 }, { x: 17.63, y: -24.27 }, { x: 66.57, y: -21.63 },
      { x: 28.53, y: 9.27 }, { x: 41.13, y: 56.63 }, { x: 0, y: 30 },
      { x: -41.13, y: 56.63 }, { x: -28.53, y: 9.27 }, { x: -66.57, y: -21.63 },
      { x: -17.63, y: -24.27 }, { x: 0, y: -70 },
    ];
    const pathSpec: draw.PathSpec = {
      kind: 'path', x: 280, y: 110,
      commands: [
        { kind: 'moveTo', x: -60, y: 0 },
        { kind: 'quadTo', cpx: -60, cpy: -60, x: 0, y: -60 },
        { kind: 'quadTo', cpx: 60, cpy: -60, x: 60, y: 0 },
        { kind: 'quadTo', cpx: 60, cpy: 60, x: 0, y: 60 },
        { kind: 'quadTo', cpx: -60, cpy: 60, x: -60, y: 0 },
        { kind: 'close' },
      ],
      fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
    };

    type Outline = ReadonlyArray<{ x: number; y: number }> | undefined;
    const cells: Array<{
      kind: string; cx: number; cy: number;
      bounds: { x: number; y: number; width: number; height: number };
      outline: Outline;
    }> = [
      { kind: 'rect', cx: -280, cy: -110, bounds: { x: -380, y: -170, width: 200, height: 120 }, outline: undefined },
      { kind: 'circle', cx: 0, cy: -110, bounds: { x: -60, y: -170, width: 120, height: 120 }, outline: undefined },
      { kind: 'ellipse', cx: 280, cy: -110, bounds: { x: 200, y: -160, width: 160, height: 100 }, outline: undefined },
      {
        kind: 'polygon', cx: -280, cy: 110,
        bounds: { x: -350, y: 50, width: 140, height: 120 },
        outline: [
          { x: -280, y: 50 }, { x: -210, y: 170 },
          { x: -350, y: 170 }, { x: -280, y: 50 },
        ],
      },
      {
        kind: 'star', cx: 0, cy: 110,
        bounds: { x: -70, y: 40, width: 140, height: 140 },
        outline: starLocal.map((p) => ({ x: p.x, y: p.y + 110 })),
      },
      {
        kind: 'path', cx: 280, cy: 110,
        bounds: { x: 220, y: 50, width: 120, height: 120 },
        outline: draw.pathOutline(pathSpec, 16),
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-glow-layer', options: {} });
    canvas.layers.add(layer);

    const decoSlots = cells.map((_, i) => {
      const slot = layer.createContainer(`glow-slot-${i}`);
      const g = layer.createGraphics(`glow-gfx-${i}`);
      slot.addChild(g);
      return { slot, g };
    });
    const hostG = layer.createGraphics('host-gfx');

    const settings = { color: '#38bdf8', padding: 12, alpha: 0.6, blur: 8 };

    function redraw() {
      const opts = {
        color: toHex(settings.color),
        padding: settings.padding,
        alpha: settings.alpha,
        blur: settings.blur,
      };
      hostG.clear();
      for (const [i, c] of cells.entries()) {
        const { slot, g } = decoSlots[i]!;
        draw.setupGlow(slot, opts);
        g.clear();
        draw.drawGlow(g, c.bounds, opts, c.kind, c.outline);

        if (c.kind === 'rect') {
          draw.drawRect(hostG, {
            kind: 'rect', x: c.cx, y: c.cy, width: 200, height: 120,
            fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
          });
        } else if (c.kind === 'circle') {
          draw.drawCircle(hostG, {
            kind: 'circle', x: c.cx, y: c.cy, r: 60,
            fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
          });
        } else if (c.kind === 'ellipse') {
          draw.drawEllipse(hostG, {
            kind: 'ellipse', x: c.cx, y: c.cy, rx: 80, ry: 50,
            fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
          });
        } else if (c.kind === 'polygon') {
          draw.drawPolygon(hostG, {
            kind: 'polygon', x: c.cx, y: c.cy,
            points: [{ x: 0, y: -60 }, { x: 70, y: 60 }, { x: -70, y: 60 }],
            fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
          });
        } else if (c.kind === 'star') {
          draw.drawStar(hostG, {
            kind: 'star', x: c.cx, y: c.cy, points: 5,
            outerRadius: 70, innerRadius: 30,
            fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
          });
        } else if (c.kind === 'path') {
          draw.drawPath(hostG, pathSpec);
        }
      }
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Glow (all shapes)' });
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'padding', 0, 40, 1).onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'blur', 0, 30, 1).onChange(redraw);
  },
};
