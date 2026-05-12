import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/LiquidFill' };
export default meta;
type Story = StoryObj;

/**
 * Liquid fill applied uniformly to every built-in shape kind. The
 * decoration masks itself to whatever the host's `paintInto` traces, so
 * a single implementation produces a consistent "fluid level" inside any
 * silhouette.
 *
 * Toggle **wave** off for still water (the decoration's `tick` returns
 * `false` and the renderer retires it from its animation set — zero
 * per-frame cost). Toggle **highlight** to add a glossy meniscus band on
 * the surface.
 */
export const LiquidFill: Story = {
  render: () => createContainer({ id: 'cvs-deco-liquid-fill' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-liquid-fill')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'liquid-fill', options: {} });
    canvas.layers.add(layer);

    const hosts = [
      { id: 'circle',   spec: { kind: 'circle' as const,
          x: -220, y: -110, radius: 50,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
      { id: 'rect',     spec: { kind: 'rect' as const,
          x: -55,  y: -155, width: 110, height: 90, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
      { id: 'triangle', spec: { kind: 'regular-polygon' as const,
          x: 220, y: -110, sides: 3, radius: 60,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
      { id: 'hexagon',  spec: { kind: 'regular-polygon' as const,
          x: -220, y: 110, sides: 6, radius: 55, rotation: Math.PI / 6,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
      { id: 'star',     spec: { kind: 'star' as const,
          x: 0, y: 110, points: 5, outerRadius: 60, innerRadius: 25,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
      { id: 'chevron',  spec: { kind: 'polygon' as const, x: 220, y: 110,
          vertices: [
            { x: -60, y: -35 }, { x:  25, y: -35 }, { x:  60, y: 0 },
            { x:  25, y:  35 }, { x: -60, y:  35 }, { x: -25, y: 0 },
          ],
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1f3a5f, width: 2, alpha: 1 } } },
    ];
    for (const h of hosts) layer.renderer.addShape(h.id, h.spec);
    const hostIds = hosts.map((h) => h.id);

    const settings = {
      fillColor: 0x4f9cf9,
      strokeColor: 0x1f3a5f,
      strokeWidth: 2,
      strokeAlpha: 1,
      fillLevel: 0.6,
      colorTop: 0xbcd2ea,
      colorBottom: 0x315c89,
      alpha: 1,
      wave: true,
      amplitude: 4,
      wavelength: 90,
      periodMs: 1800,
      highlight: true,
      highlightAlpha: 0.45,
      highlightThickness: 4,
    };

    const apply = () => {
      const style = {
        fillLevel: settings.fillLevel,
        colorTop: settings.colorTop,
        colorBottom: settings.colorBottom,
        alpha: settings.alpha,
        ...(settings.wave
          ? {
              wave: {
                amplitude: settings.amplitude,
                wavelength: settings.wavelength,
                periodMs: settings.periodMs,
              },
            }
          : {}),
        ...(settings.highlight
          ? {
              surfaceHighlight: {
                color: 0xffffff,
                alpha: settings.highlightAlpha,
                thickness: settings.highlightThickness,
              },
            }
          : {}),
      };
      for (const id of hostIds) {
        layer.renderer.setDecoration(id, 'liquid', { kind: 'liquid-fill', style });
      }
    };
    apply();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const applyStroke = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, {
          stroke: {
            color: settings.strokeColor,
            width: settings.strokeWidth,
            alpha: settings.strokeAlpha,
          },
        });
      }
    };

    const gui = new GUI({ title: 'Liquid fill' });
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);

    const strokeFolder = gui.addFolder('Stroke');
    strokeFolder.addColor(settings, 'strokeColor').name('color').onChange(applyStroke);
    strokeFolder.add(settings, 'strokeWidth', 0, 12, 0.5).name('width').onChange(applyStroke);
    strokeFolder.add(settings, 'strokeAlpha', 0, 1, 0.05).name('alpha').onChange(applyStroke);
    gui.add(settings, 'fillLevel', 0, 1, 0.01).onChange(apply);
    gui.addColor(settings, 'colorTop').onChange(apply);
    gui.addColor(settings, 'colorBottom').onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);

    const waveFolder = gui.addFolder('Wave');
    waveFolder.add(settings, 'wave').name('animated').onChange(apply);
    waveFolder.add(settings, 'amplitude', 0, 16, 0.5).onChange(apply);
    waveFolder.add(settings, 'wavelength', 10, 200, 5).onChange(apply);
    waveFolder.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);

    const hlFolder = gui.addFolder('Surface highlight');
    hlFolder.add(settings, 'highlight').onChange(apply);
    hlFolder.add(settings, 'highlightAlpha', 0, 1, 0.05).onChange(apply);
    hlFolder.add(settings, 'highlightThickness', 0, 12, 0.5).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 200);
  },
};
