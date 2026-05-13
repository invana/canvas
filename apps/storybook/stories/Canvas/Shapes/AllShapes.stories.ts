import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { BadgePlacement, CanvasContext, ShapeFill, ShapeFillLayer, ShapeStroke } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Canvas/Shapes/AllShapes' };
export default meta;
type Story = StoryObj;

export const AllShapes: Story = {
  render: () => createContainer({ id: 'cvs-all-shapes' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-all-shapes')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'all-shapes', options: {} });
    canvas.layers.add(layer);

    // 3 columns × 2 rows. Each cell holds one shape + a label rect below.
    const COL_GAP = 220;
    const ROW_GAP = 220;
    const LABEL_OFFSET_Y = 80;
    const LABEL_W = 140;
    const LABEL_H = 22;

    const cellX = (col: number) => (col - 1) * COL_GAP;
    const cellY = (row: number) => (row - 0.5) * ROW_GAP;

    const shapes = [
      { id: 'circle', col: 0, row: 0, label: 'Circle',
        spec: { kind: 'circle' as const, radius: 50,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 },
          stroke: { color: 0x1e40af, width: 2 } } },
      { id: 'rect',   col: 1, row: 0, label: 'Rectangle',
        spec: { kind: 'rect' as const, width: 110, height: 90, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0x10b981 },
          stroke: { color: 0x047857, width: 2 } } },
      { id: 'triangle', col: 2, row: 0, label: 'Triangle',
        spec: { kind: 'regular-polygon' as const, sides: 3, radius: 60,
          fill: { kind: 'solid' as const, color: 0xf59e0b },
          stroke: { color: 0xb45309, width: 2 } } },
      { id: 'hexagon', col: 0, row: 1, label: 'Hexagon',
        spec: { kind: 'regular-polygon' as const, sides: 6, radius: 55, rotation: Math.PI / 6,
          fill: { kind: 'solid' as const, color: 0xa855f7 },
          stroke: { color: 0x6d28d9, width: 2 } } },
      { id: 'star',    col: 1, row: 1, label: 'Star',
        spec: { kind: 'star' as const, points: 5, outerRadius: 60, innerRadius: 25,
          fill: { kind: 'solid' as const, color: 0xef4444 },
          stroke: { color: 0x991b1b, width: 2 } } },
      // Chevron — concave; pointy on the right with a V-notch on the left.
      { id: 'polygon', col: 2, row: 1, label: 'Polygon (chevron)',
        spec: { kind: 'polygon' as const,
          vertices: [
            { x: -60, y: -35 },
            { x:  25, y: -35 },
            { x:  60, y:   0 },
            { x:  25, y:  35 },
            { x: -60, y:  35 },
            { x: -25, y:   0 },
          ],
          fill: { kind: 'solid' as const, color: 0x06b6d4 },
          stroke: { color: 0x0e7490, width: 2 } } },
    ];

    const showcaseIds = shapes.map((s) => s.id);

    for (const s of shapes) {
      const x = cellX(s.col);
      const y = cellY(s.row);

      if (s.spec.kind === 'rect') {
        layer.renderer.addShape(s.id, {
          ...s.spec,
          x: x - s.spec.width / 2,
          y: y - s.spec.height / 2,
        });
      } else {
        layer.renderer.addShape(s.id, { ...s.spec, x, y });
      }

      layer.renderer.addShape(`${s.id}-label`, {
        kind: 'rect',
        x: x - LABEL_W / 2,
        y: y + LABEL_OFFSET_Y,
        width: LABEL_W,
        height: LABEL_H,
        fill: [
          { kind: 'text', text: s.label, color: 0x0f172a, fontSize: 13, fontWeight: 600 },
        ],
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 100);

    // ─── GUI: one knob = same change applied to every showcase shape ────────

    // Public picsum.photos samples. The TextureRegistry's `loadTextures`
    // parser hint handles extensionless URLs (see TextureRegistry.load
    // docstring), so these resolve without a manual `Assets.add` call.
    const IMAGE_PRESETS = {
      mountain: 'https://picsum.photos/seed/invana/200/200',
      forest:   'https://picsum.photos/seed/forest/200/200',
      ocean:    'https://picsum.photos/seed/ocean/200/200',
      city:     'https://picsum.photos/seed/city/200/200',
    } as const;

    const settings = {
      showSolid: true,
      fillColor: '#4f9cf9',
      showGlyph: true,
      glyphChar: '★',
      glyphColor: '#ffffff',
      glyphSize: 0.75,
      showImage: true,
      imagePreset: 'forest' as keyof typeof IMAGE_PRESETS,
      imageUrl: IMAGE_PRESETS.forest as string,
      imageFit: 'cover' as 'fill' | 'cover' | 'contain' | 'none' | 'tile',
      imageAlpha: 0.6,
      strokeColor: '#0f172a',
      strokeWidth: 2,
      strokeAlpha: 1,
      showBadge: false,
      badgePlacement: 'top-right' as BadgePlacement,
      badgeText: 'NEW',
    };

    const toHexNumber = (s: string): number => {
      const t = s.startsWith('#') ? s.slice(1) : s;
      return parseInt(t.length === 3
        ? t.split('').map((c) => c + c).join('')
        : t, 16);
    };

    // Fill layers compose: silhouette fillers (solid / image) paint into the
    // shape in array order; inset content (glyph) overlays on top. Toggle any
    // combination — e.g. solid + glyph, image + glyph, just glyph on the
    // shape's silhouette, all three stacked, or nothing at all.
    const buildFill = (): ShapeFill => {
      const layers: ShapeFillLayer[] = [];
      if (settings.showSolid) {
        layers.push({ kind: 'solid', color: toHexNumber(settings.fillColor) });
      }
      if (settings.showImage) {
        // Painted *after* the solid layer — drop the alpha so the solid
        // background tint blends through instead of being fully covered.
        layers.push({
          kind: 'image',
          url: settings.imageUrl,
          fit: settings.imageFit,
          alpha: settings.imageAlpha,
        });
      }
      if (settings.showGlyph) {
        layers.push({
          kind: 'glyph',
          char: settings.glyphChar,
          fontFamily: 'sans-serif',
          fontWeight: 700,
          color: toHexNumber(settings.glyphColor),
          sizeRatio: settings.glyphSize,
        });
      }
      return layers;
    };

    const buildStroke = (): ShapeStroke => ({
      color: toHexNumber(settings.strokeColor),
      width: settings.strokeWidth,
      alpha: settings.strokeAlpha,
    });

    const applyToAllShapes = () => {
      const fill = buildFill();
      const stroke = buildStroke();
      for (const id of showcaseIds) {
        layer.renderer.updateShape(id, { fill, stroke });
        if (settings.showBadge) {
          layer.renderer.setBadge(id, 'badge', {
            shape: {
              kind: 'rect',
              width: Math.max(46, settings.badgeText.length * 9 + 16),
              height: 22,
              cornerRadius: 11,
              fill: [
                { kind: 'solid', color: 0xef4444 },
                { kind: 'text', text: settings.badgeText, color: 0xffffff, fontSize: 11, fontWeight: 700 },
              ],
            },
            placement: settings.badgePlacement,
          });
        } else {
          layer.renderer.removeBadge(id, 'badge');
        }
      }
    };

    // Apply once on load so the initial paint reflects the GUI defaults
    // (large white star glyph on a uniform blue bg, no badge) instead of
    // the per-shape distinct colors hard-coded above.
    applyToAllShapes();

    const gui = new GUI({ title: 'All shapes — live settings' });
    onStoryTeardown(() => gui.destroy());

    const fillFolder = gui.addFolder('Fill (compose layers)');
    fillFolder.add(settings, 'showSolid').name('solid bg').onChange(applyToAllShapes);
    fillFolder.addColor(settings, 'fillColor').name('bg color').onChange(applyToAllShapes);
    fillFolder.add(settings, 'showGlyph').name('glyph').onChange(applyToAllShapes);
    fillFolder.add(settings, 'glyphChar', ['★', '♥', '✦', '@', 'A', '✈', '☀']).name('glyph char').onChange(applyToAllShapes);
    fillFolder.addColor(settings, 'glyphColor').name('glyph color').onChange(applyToAllShapes);
    fillFolder.add(settings, 'glyphSize', 0.1, 1, 0.05).name('glyph size').onChange(applyToAllShapes);
    fillFolder.add(settings, 'showImage').name('image bg').onChange(applyToAllShapes);
    fillFolder.add(settings, 'imagePreset', Object.keys(IMAGE_PRESETS)).name('image preset').onChange((key: keyof typeof IMAGE_PRESETS) => {
      settings.imageUrl = IMAGE_PRESETS[key];
      imageUrlCtrl.updateDisplay();
      applyToAllShapes();
    });
    const imageUrlCtrl = fillFolder.add(settings, 'imageUrl').name('image url').onChange(applyToAllShapes);
    fillFolder.add(settings, 'imageFit', ['fill', 'cover', 'contain', 'none', 'tile']).name('image fit').onChange(applyToAllShapes);
    fillFolder.add(settings, 'imageAlpha', 0, 1, 0.01).name('image alpha').onChange(applyToAllShapes);

    const strokeFolder = gui.addFolder('Stroke');
    strokeFolder.addColor(settings, 'strokeColor').onChange(applyToAllShapes);
    strokeFolder.add(settings, 'strokeWidth', 0, 12, 1).onChange(applyToAllShapes);
    strokeFolder.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(applyToAllShapes);

    const badgeFolder = gui.addFolder('Badge');
    badgeFolder.add(settings, 'showBadge').onChange(applyToAllShapes);
    badgeFolder.add(settings, 'badgePlacement', [
      'top', 'bottom', 'left', 'right',
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
    ]).onChange(applyToAllShapes);
    badgeFolder.add(settings, 'badgeText').onChange(applyToAllShapes);
  },
};
