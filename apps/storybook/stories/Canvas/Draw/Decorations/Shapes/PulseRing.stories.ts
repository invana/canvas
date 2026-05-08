import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/PulseRing' };
export default meta;
type Story = StoryObj;

export const PulseRing: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-pulse-ring' }),

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

    // Star outline (5-point, outerR=70, innerR=30) — pre-computed in shape-
    // local coords so the decoration can trace the actual silhouette via
    // parallel offset (instead of the AABB fallback).
    const starLocal = [
      { x: 0, y: -70 }, { x: 17.63, y: -24.27 }, { x: 66.57, y: -21.63 },
      { x: 28.53, y: 9.27 }, { x: 41.13, y: 56.63 }, { x: 0, y: 30 },
      { x: -41.13, y: 56.63 }, { x: -28.53, y: 9.27 }, { x: -66.57, y: -21.63 },
      { x: -17.63, y: -24.27 }, { x: 0, y: -70 },
    ];
    // Path host: rounded-square via 4 quadTo curves (±60 extent). Defined
    // once and reused for both painting (drawPath) and decoration outline
    // (pathOutline tessellates the curves into a 16-samples-per-curve closed
    // polyline, so offsetPolygon produces a smooth-looking parallel offset
    // instead of the visible facets a coarser polyline would yield).
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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-pulse-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-pulse-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoSlots = cells.map((_, i) => {
      const slot = layer.createContainer(`pulse-slot-${i}`);
      const g = layer.createGraphics(`pulse-gfx-${i}`);
      slot.addChild(g);
      return { slot, g };
    });

    const settings = {
      color: '#a78bfa', width: 2, alpha: 0.6,
      startPadding: 0, endPadding: 30, periodMs: 1500, ringCount: 1,
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
        const deco = new draw.PulseRingDecoration(slot.slot, slot.g, {
          color: toHex(settings.color),
          width: settings.width,
          alpha: settings.alpha,
          startPadding: settings.startPadding,
          endPadding: settings.endPadding,
          periodMs: settings.periodMs,
          ringCount: settings.ringCount,
        });
        deco.update(c.bounds, c.kind, c.outline);
        return deco;
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Pulse Ring (all shapes)' });
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 1).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'startPadding', 0, 30, 1).onChange(rebuild);
    gui.add(settings, 'endPadding', 10, 80, 1).onChange(rebuild);
    gui.add(settings, 'periodMs', 200, 5000, 100).onChange(rebuild);
    gui.add(settings, 'ringCount', 1, 5, 1).onChange(rebuild);
  },
};
