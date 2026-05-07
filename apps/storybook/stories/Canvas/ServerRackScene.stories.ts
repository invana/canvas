import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  ShapesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../div-util';

const meta: Meta = { title: 'Canvas/Showcase/Server Rack Scene' };
export default meta;
type Story = StoryObj;

export const ServerRackScene: Story = {
  render: () => createContainer({ id: 'cvs-server-rack-scene' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: ShapesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new ShapesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-server-rack-scene')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'server-rack-scene', options: {} });
    canvas.layers.add(layer);

    const settings = {
      units: 6,
      developers: 3,
      chassisColor: '#111827',
      unitColor: '#374151',
      ledColor: '#10b981',
      skinColor: '#fcd5b4',
      cableWidth: 2,
      alertUnit: 2,
      alertColor: '#ef4444',
    };

    const devPalette = [0xef4444, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0x06b6d4];

    const rackCx = 720;
    const rackTop = 80;
    const rackW = 240;
    const rackPadding = 18;
    const unitH = 44;
    const unitGap = 6;
    const unitW = rackW - rackPadding * 2;

    const devBaseY = 360;
    const devSpacing = 190;
    const devStartX = 100;

    const shapeIds: string[] = [];
    const connectorIds: string[] = [];

    function addShape(id: string, props: Record<string, unknown>) {
      layer.renderer.addShape(id, props as never);
      shapeIds.push(id);
    }
    function addConnector(id: string, props: Record<string, unknown>) {
      layer.renderer.addConnector(id, props as never);
      connectorIds.push(id);
    }

    function unitCenterY(i: number, rackInnerTop: number): number {
      return rackInnerTop + i * (unitH + unitGap) + unitH / 2;
    }

    function targetUnitFor(devIndex: number): number {
      return Math.min(
        settings.units - 1,
        Math.floor((devIndex + 0.5) * settings.units / settings.developers),
      );
    }

    function buildRack() {
      const rackInnerH = settings.units * unitH + (settings.units - 1) * unitGap;
      const rackH = rackInnerH + rackPadding * 2;
      const rackCy = rackTop + rackH / 2;
      const rackInnerTop = rackTop + rackPadding;

      addShape('rack-shadow', {
        kind: 'rect', x: rackCx + 4, y: rackCy + 6,
        width: rackW, height: rackH,
        cornerRadius: 8, fill: 0x000000, alpha: 0.18,
      });

      addShape('rack-frame', {
        kind: 'rect', x: rackCx, y: rackCy,
        width: rackW, height: rackH,
        cornerRadius: 8, fill: toHex(settings.chassisColor),
        stroke: 0x000000, strokeWidth: 2,
      });

      addShape('rack-label', {
        kind: 'text', x: rackCx - rackW / 2 + 4, y: rackTop - 22,
        text: 'PROD-RACK-01',
        style: { fill: 0x111827, fontSize: 14, fontWeight: '700' },
      });

      for (let i = 0; i < settings.units; i++) {
        const cy = unitCenterY(i, rackInnerTop);

        addShape(`unit-${i}`, {
          kind: 'rect', x: rackCx, y: cy,
          width: unitW, height: unitH,
          cornerRadius: 3, fill: toHex(settings.unitColor),
          stroke: 0x000000, strokeWidth: 1,
        });

        const stripW = 5;
        addShape(`unit-${i}-strip`, {
          kind: 'rect',
          x: rackCx - unitW / 2 + stripW / 2 + 4,
          y: cy,
          width: stripW, height: unitH - 12,
          cornerRadius: 1, fill: 0x111827,
        });

        const ventW = 110;
        const ventH = 6;
        addShape(`unit-${i}-vent`, {
          kind: 'rect',
          x: rackCx - 12,
          y: cy,
          width: ventW, height: ventH,
          cornerRadius: 1, fill: 0x000000, alpha: 0.7,
        });

        const ledX = rackCx + unitW / 2 - 14;
        const isAlert = i === settings.alertUnit;
        addShape(`unit-${i}-led-power`, {
          kind: 'circle', x: ledX, y: cy - 8, r: 3,
          fill: toHex(settings.ledColor), stroke: 0x064e3b, strokeWidth: 1,
        });
        addShape(`unit-${i}-led-act`, {
          kind: 'circle', x: ledX - 12, y: cy - 8, r: isAlert ? 4 : 3,
          fill: isAlert ? toHex(settings.alertColor) : 0xf59e0b,
          stroke: isAlert ? 0x7f1d1d : 0x78350f, strokeWidth: 1,
        });
      }
    }

    function applyAlertDecoration() {
      const i = settings.alertUnit;
      if (i < 0 || i >= settings.units) return;
      const rackInnerTop = rackTop + rackPadding;
      const cy = unitCenterY(i, rackInnerTop);
      const ledX = rackCx + unitW / 2 - 14;

      // Dedicated invisible anchor shape, added LAST so its decoration
      // children render above every unit/dev shape — guarantees the pulse
      // rings aren't occluded by neighbouring units rendered after the
      // alert unit's gfx subtree.
      addShape('alert-anchor-led', {
        kind: 'circle', x: ledX - 12, y: cy - 8, r: 5,
        fill: 0x000000, alpha: 0,
      });
      layer.renderer.setDecoration('alert-anchor-led', 'pulse', {
        kind: 'pulse-ring',
        style: {
          color: toHex(settings.alertColor),
          width: 2.5,
          alpha: 0.9,
          startPadding: 0,
          endPadding: 22,
          periodMs: 1100,
          ringCount: 3,
        },
      } as never);
    }

    function buildDeveloper(index: number) {
      const cx = devStartX + index * devSpacing;
      const color = devPalette[index % devPalette.length]!;

      const headR = 18;
      const headCy = devBaseY;
      const bodyW = 56;
      const bodyH = 64;
      const bodyTopY = headCy + headR + 4;
      const bodyCy = bodyTopY + bodyH / 2;

      const laptopW = 80;
      const laptopH = 10;
      const laptopCy = bodyTopY + bodyH + 6 + laptopH / 2;

      const screenW = 70;
      const screenH = 26;
      const screenCy = laptopCy - laptopH / 2 - screenH / 2 - 1;

      addShape(`dev-${index}-head`, {
        kind: 'circle', x: cx, y: headCy, r: headR,
        fill: toHex(settings.skinColor),
        stroke: 0x78350f, strokeWidth: 1.5,
      });

      addShape(`dev-${index}-hair`, {
        kind: 'path', x: cx, y: headCy,
        commands: [
          { kind: 'moveTo', x: -headR, y: -2 },
          { kind: 'quadTo', cpx: -headR * 0.6, cpy: -headR - 4, x: 0, y: -headR - 2 },
          { kind: 'quadTo', cpx: headR * 0.6, cpy: -headR - 4, x: headR, y: -2 },
          { kind: 'lineTo', x: headR - 2, y: -8 },
          { kind: 'lineTo', x: -headR + 2, y: -8 },
          { kind: 'close' },
        ],
        fill: 0x4b5563,
      });

      addShape(`dev-${index}-body`, {
        kind: 'path', x: cx, y: bodyTopY,
        commands: [
          { kind: 'moveTo', x: -bodyW / 2 + 8, y: 0 },
          { kind: 'lineTo', x: bodyW / 2 - 8, y: 0 },
          { kind: 'lineTo', x: bodyW / 2, y: bodyH },
          { kind: 'lineTo', x: -bodyW / 2, y: bodyH },
          { kind: 'close' },
        ],
        fill: color, stroke: 0x111827, strokeWidth: 1.5,
      });

      addShape(`dev-${index}-laptop-base`, {
        kind: 'rect', x: cx, y: laptopCy,
        width: laptopW, height: laptopH,
        cornerRadius: 2, fill: 0x4b5563, stroke: 0x111827, strokeWidth: 1,
      });

      addShape(`dev-${index}-laptop-screen`, {
        kind: 'rect', x: cx, y: screenCy,
        width: screenW, height: screenH,
        cornerRadius: 2, fill: 0x111827, stroke: 0x000000, strokeWidth: 1,
      });

      addShape(`dev-${index}-laptop-glow`, {
        kind: 'rect', x: cx, y: screenCy,
        width: screenW - 8, height: screenH - 8,
        cornerRadius: 1, fill: color, alpha: 0.45,
      });

      addShape(`dev-${index}-label`, {
        kind: 'text', x: cx - 22, y: bodyCy + bodyH / 2 + 14,
        text: `dev-${index + 1}`,
        style: { fill: 0x111827, fontSize: 12, fontWeight: '600' },
      });
    }

    function buildCables() {
      for (let i = 0; i < settings.developers; i++) {
        const color = devPalette[i % devPalette.length]!;
        const targetUnit = targetUnitFor(i);

        addConnector(`cable-${i}`, {
          kind: 'curve', router: 'bezier',
          source: { kind: 'shape', shapeId: `dev-${i}-laptop-screen` },
          target: { kind: 'shape', shapeId: `unit-${targetUnit}` },
          stroke: color, strokeWidth: settings.cableWidth,
          targetMarker: 'arrow',
          targetMarkerOptions: { color, size: 12 },
        });
      }
    }

    function build() {
      buildRack();
      for (let i = 0; i < settings.developers; i++) buildDeveloper(i);
      buildCables();
      applyAlertDecoration();
    }

    function clear() {
      for (const id of shapeIds) layer.renderer.removeShape(id);
      for (const id of connectorIds) layer.renderer.removeConnector(id);
      shapeIds.length = 0;
      connectorIds.length = 0;
    }

    function redraw() {
      clear();
      build();
    }

    build();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Server rack scene' });
    gui.add(settings, 'units', 1, 10, 1).onChange(redraw);
    gui.add(settings, 'developers', 1, 5, 1).onChange(redraw);
    gui.addColor(settings, 'chassisColor').onChange(redraw);
    gui.addColor(settings, 'unitColor').onChange(redraw);
    gui.addColor(settings, 'ledColor').onChange(redraw);
    gui.addColor(settings, 'skinColor').onChange(redraw);
    gui.add(settings, 'cableWidth', 1, 6, 0.5).onChange(redraw);
    gui.add(settings, 'alertUnit', 0, 9, 1).onChange(redraw);
    gui.addColor(settings, 'alertColor').onChange(redraw);
  },
};
