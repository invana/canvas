import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  ShapeBase,
} from '@invana/canvas';
import type {
  BaseShapeSpec,
  CanvasContext,
  Graphics,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/LiquidFill' };
export default meta;
type Story = StoryObj;

/**
 * Liquid fill applied to four different silhouettes — pill, circle, square,
 * triangle — using one shared style. The decoration masks itself to
 * whatever the host's `paintInto` traces, so a single implementation
 * produces a consistent "fluid level" inside any shape kind.
 *
 * Toggle **wave** off for still water (the decoration's `tick` returns
 * `false` and the renderer retires it from its animation set — zero
 * per-frame cost). Toggle **highlight** to add a glossy meniscus band on
 * the surface. Stroke alignment is `'outside'` so each host's outline
 * stays fully visible above the liquid.
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

    // Story-local triangle primitive. Engine only ships `circle` + `rect`
    // built-in; we register a minimal `triangle` for the story. Anchored
    // top-left like `rect` so `bounds()` is `{0, 0, w, h}`.
    interface TriangleSpec extends BaseShapeSpec {
      readonly kind: 'triangle';
      readonly width: number;
      readonly height: number;
    }
    class TriangleShape extends ShapeBase<TriangleSpec> {
      constructor(spec: TriangleSpec, host: ShapeHostInfo) {
        super(host);
        this.draw(spec);
      }
      protected drawGeometry(g: Graphics, spec: TriangleSpec, style?: ShapePaintStyle): void {
        const inset = style?.inset ?? 0;
        const w = spec.width - inset * 2;
        const h = spec.height - inset * 2;
        const x = inset;
        const y = inset;
        g.moveTo(x + w / 2, y);
        g.lineTo(x + w, y + h);
        g.lineTo(x, y + h);
        g.closePath();
        if (style) {
          if (style.fill !== false) {
            g.fill({ color: style.color ?? 0xffffff, alpha: style.alpha ?? 1 });
          }
          if (style.strokeWidth && style.strokeWidth > 0) {
            g.stroke({
              color: style.color ?? 0xffffff,
              alpha: style.alpha ?? 1,
              width: style.strokeWidth,
            });
          }
        } else {
          if (typeof spec.fill === 'number') {
            g.fill({ color: spec.fill });
          } else if (
            spec.fill && typeof spec.fill === 'object' && 'kind' in spec.fill &&
            spec.fill.kind === 'solid'
          ) {
            g.fill({ color: spec.fill.color, alpha: spec.fill.alpha ?? 1 });
          }
          if (spec.stroke) {
            g.stroke({
              color: spec.stroke.color,
              alpha: spec.stroke.alpha ?? 1,
              width: spec.stroke.width ?? 1,
            });
          }
        }
      }
      bounds(): Rect {
        return { x: 0, y: 0, width: this.spec.width, height: this.spec.height };
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-liquid-fill')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'liquid-fill', options: {} });
    canvas.layers.add(layer);
    layer.renderer.registerShape('triangle', TriangleShape);

    // Hero: pill-shaped tank, like the reference screenshot.
    const tankW = 280;
    const tankH = 140;
    layer.renderer.addShape('pill', {
      kind: 'rect',
      x: -tankW / 2,
      y: -tankH / 2 - 130,
      width: tankW,
      height: tankH,
      cornerRadius: tankH / 2,
      fill: { kind: 'solid', color: 0xf5f5f5 },
      stroke: { color: 0x1f2937, width: 2.5, alignment: 'outside' },
    });
    layer.renderer.addShape('pill-label', {
      kind: 'rect',
      x: -50, y: -14 - 130,
      width: 100, height: 28,
      fill: [
        { kind: 'solid', color: 0xffffff, alpha: 0.95 },
        { kind: 'text', text: 'Feed Tank', fontSize: 14, fontWeight: 600, color: 0x0f172a },
      ],
      stroke: { color: 0x1f2937, width: 1 },
      zIndex: 1,
    });

    // Variety row: circle, square, triangle — same liquid style applied to each.
    const size = 120;
    const gap = 40;
    const rowY = 50;
    const circleR = size / 2;
    const colSpan = size + gap;

    layer.renderer.addShape('circle', {
      kind: 'circle',
      x: -colSpan,
      y: rowY + circleR,
      radius: circleR,
      fill: { kind: 'solid', color: 0xf5f5f5 },
      stroke: { color: 0x1f2937, width: 2.5, alignment: 'outside' },
    });

    layer.renderer.addShape('square', {
      kind: 'rect',
      x: -size / 2,
      y: rowY,
      width: size,
      height: size,
      fill: { kind: 'solid', color: 0xf5f5f5 },
      stroke: { color: 0x1f2937, width: 2.5, alignment: 'outside' },
    });

    layer.renderer.addShape('triangle', {
      kind: 'triangle',
      x: colSpan - size / 2,
      y: rowY,
      width: size,
      height: size,
      fill: { kind: 'solid', color: 0xf5f5f5 },
      stroke: { color: 0x1f2937, width: 2.5, alignment: 'outside' },
    } as TriangleSpec);

    const targets = ['pill', 'circle', 'square', 'triangle'];

    const settings = {
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
      for (const id of targets) {
        layer.renderer.setDecoration(id, 'liquid', { kind: 'liquid-fill', style });
      }
    };
    apply();

    const gui = new GUI({ title: 'Liquid fill' });
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

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
