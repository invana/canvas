import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/MarchingAnts' };
export default meta;
type Story = StoryObj;

export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-marching-ants' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      decos: draw.AnimatedDecoration[] = [];
      protected createState() { return {}; }
      hitTest() { return null; }
      tickAnimations(dt: number) {
        for (const d of this.decos) d.tick(dt);
      }
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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-marching-ants')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-ants-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoSlots = cells.map((_, i) => {
      const slot = layer.createContainer(`ants-slot-${i}`);
      const g = layer.createGraphics(`ants-gfx-${i}`);
      slot.addChild(g);
      return { slot, g };
    });

    const settings = {
      color: '#f43f5e', width: 1.5, alpha: 1,
      dashLength: 6, gapLength: 4, speed: 0.04, inset: 2,
    };

    function redrawHosts() {
      hostG.clear();
      for (const c of cells) {
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

    function rebuild() {
      redrawHosts();
      for (const d of layer.decos) d.destroy();
      layer.decos = cells.map((c, i) => {
        const slot = decoSlots[i]!;
        const deco = new draw.MarchingAntsDecoration(slot.slot, slot.g, {
          color: toHex(settings.color),
          width: settings.width,
          alpha: settings.alpha,
          dashLength: settings.dashLength,
          gapLength: settings.gapLength,
          speed: settings.speed,
          inset: settings.inset,
        });
        deco.update(c.bounds, c.kind, c.outline);
        return deco;
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Marching Ants (all shapes)' });
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 0.5).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'dashLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'gapLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'speed', 0, 0.2, 0.005).onChange(rebuild);
    gui.add(settings, 'inset', 0, 20, 1).onChange(rebuild);
  },
};
